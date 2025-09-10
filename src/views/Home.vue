<script setup lang="ts">
import NetworkSelector from '@/components/NetworkSelector.vue'
import { useBlockchain } from '@/stores/useBlockchain'
import { getErrorMessage } from '@/utils'
import { EthereumRpcError } from '@samanager/sdk'
import { useVueDapp } from '@vue-dapp/core'
import { useVueDappModal } from '@vue-dapp/modal'
import { createPublicClient, createWalletClient, custom, http, parseAbi } from 'viem'
import { eip5792Actions } from 'viem/experimental'

const { wallet, isConnected, watchWalletChanged, watchDisconnect, disconnect, onChainChanged } = useVueDapp()

// Blockchain store for selected network
const { selectedNetwork } = useBlockchain()

const paymasterUrl = computed(() => {
	const chainName = selectedNetwork.value.name
	return `https://api.candide.dev/paymaster/v3/${chainName}/${import.meta.env.VITE_CANDIDE_API_KEY}`
})

// Counter contract setup
const COUNTER_CONTRACT_ADDRESS = '0x96e44D241D3A6B069C3DF4e69DE28Ea098805b18'

const counterAbi = parseAbi(['function increment() external', 'function number() public view returns (uint256)'])

// Reactive state
const isIncrementing = ref(false)
const incrementError = ref<string | null>(null)
const callsStatus = ref<string | undefined>()
const transactionHash = ref<string | null>(null)

// Chain switching state
const switchChainError = ref<string | null>(null)
const isSwitchingChain = ref(false)

// Counter reading state
const counterValue = ref<bigint | null>(null)
const isLoadingCounter = ref(false)
const counterError = ref<string | null>(null)

// Chain mismatch detection
const isChainMismatch = computed(() => {
	if (!isConnected.value || !wallet.chainId) return false
	return wallet.chainId !== selectedNetwork.value.id
})

// Watch for network changes and re-read counter
watchImmediate(selectedNetwork, async () => {
	await readCounterValue()
})

onChainChanged((chainId: number) => {
	console.log('chainChanged', chainId)
	// Re-read counter value when chain changes
	readCounterValue()
})

watchWalletChanged(async wallet => {
	console.log('wallet', wallet)
})

watchDisconnect(() => {
	console.log('disconnect')
})

function onClickConnectButton() {
	if (isConnected.value) {
		disconnect()
	} else {
		useVueDappModal().open()
	}
}

async function onClickSwitchChain() {
	switchChainError.value = null
	isSwitchingChain.value = true

	try {
		if (!wallet.provider) {
			throw new Error('wallet.provider not found')
		}

		await wallet.provider.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: `0x${selectedNetwork.value.id.toString(16)}` }],
		})

		// Chain switch was successful - the wallet will automatically update
		// and the computed property will reflect the change
	} catch (err) {
		console.error('Chain switch failed:', err)
		if (err instanceof EthereumRpcError) {
			switchChainError.value = `${err.code}: ${err.message}`
		} else {
			switchChainError.value = `Error switching chain: ${getErrorMessage(err)}`
		}
	} finally {
		isSwitchingChain.value = false
	}
}

async function readCounterValue() {
	try {
		isLoadingCounter.value = true
		counterError.value = null

		// Create public client for reading
		const publicClient = createPublicClient({
			chain: selectedNetwork.value.chain,
			transport: http(),
		})

		// Read the counter value
		const result = await publicClient.readContract({
			address: COUNTER_CONTRACT_ADDRESS,
			abi: counterAbi,
			functionName: 'number',
		})

		counterValue.value = result as bigint
	} catch (error) {
		console.error('Failed to read counter value:', error)
		counterError.value = getErrorMessage(error)
		counterValue.value = null
	} finally {
		isLoadingCounter.value = false
	}
}

async function onClickIncrement() {
	if (!wallet.provider || !wallet.address) {
		incrementError.value = 'Wallet not connected'
		return
	}

	if (isChainMismatch.value) {
		incrementError.value = 'Please switch to the correct network first'
		return
	}

	try {
		isIncrementing.value = true
		incrementError.value = null
		transactionHash.value = null

		// Create viem wallet client with EIP-5792 actions
		const client = createWalletClient({
			chain: selectedNetwork.value.chain,
			transport: custom(wallet.provider),
		}).extend(eip5792Actions())

		// Send increment transaction using writeContracts
		const result = await client.writeContracts({
			account: wallet.address as `0x${string}`,
			contracts: [
				{
					address: COUNTER_CONTRACT_ADDRESS,
					abi: counterAbi,
					functionName: 'increment',
				},
			],
			capabilities: {
				paymasterService: {
					url: paymasterUrl.value,
					context: {
						name: 'Candide Paymaster',
						icon: 'https://paymaster-service.infra.candide.dev/api/files/33beceb9720c7dce313b543d35d689b6c5699545fe0fc0977961aa40d8f90429/6d9ac3ee255853747bc1df4fb7d03204_metadata_default_logo.png',
						sponsorshipPolicyId: 'f0785f78e6678a99',
					},
				},
			},
		})

		console.log('writeContracts result:', result)

		// Poll for status using for loop as requested
		for (let i = 0; i < 60; i++) {
			// Max 60 attempts (5 minutes)
			try {
				const status = await client.getCallsStatus({ id: result.id })
				console.log(`Poll attempt ${i + 1}:`, status)

				callsStatus.value = status.status || 'unknown'

				if (status.status === 'success') {
					if (status.receipts?.[0]?.transactionHash) {
						transactionHash.value = status.receipts[0].transactionHash
					}
					// Re-read counter value after successful increment
					readCounterValue()
					break
				} else if (status.status === 'failure') {
					incrementError.value = 'Transaction failed'
					break
				}

				// Wait 5 seconds before next poll
				await new Promise(resolve => setTimeout(resolve, 5000))
			} catch (pollError) {
				console.warn(`Poll attempt ${i + 1} failed:`, pollError)
				if (i === 59) {
					// Last attempt
					incrementError.value = 'Failed to get transaction status'
				}
			}
		}
	} catch (error) {
		console.error('Increment failed:', error)
		incrementError.value = getErrorMessage(error)
	} finally {
		isIncrementing.value = false
	}
}
</script>

<template>
	<div class="p-5 flex flex-col gap-5">
		<NetworkSelector />

		<!-- Wallet Connection Section -->
		<div>
			<div>
				<button class="btn" @click="onClickConnectButton">
					{{ isConnected ? 'Disconnect' : 'Connect' }}
				</button>
			</div>

			<div>name: {{ wallet.providerInfo?.name }}</div>
			<div>status: {{ wallet.status }}</div>
			<div v-if="wallet.error">error: {{ getErrorMessage(wallet.error) }}</div>

			<div v-if="isConnected">
				<div>chainId: {{ wallet.chainId }}</div>
				<div>address: {{ wallet.address }}</div>
			</div>
		</div>

		<!-- Chain Mismatch Section -->
		<div v-if="isConnected && isChainMismatch" class="border border-yellow-500 bg-yellow-50 p-3 rounded">
			<div class="flex items-center gap-3 mb-2">
				<span class="text-yellow-600 font-medium">⚠️ Chain Mismatch</span>
			</div>
			<div class="text-sm text-yellow-700 mb-3">
				Your wallet is on chain {{ wallet.chainId }} (0x{{ BigInt(wallet.chainId || 0).toString(16) }}), but
				this dapp requires {{ selectedNetwork.displayName }} ({{ selectedNetwork.id }} / 0x{{
					selectedNetwork.id.toString(16)
				}}).
			</div>
			<div class="flex items-center gap-3">
				<button
					class="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white"
					@click="onClickSwitchChain"
					:disabled="isSwitchingChain"
				>
					{{ isSwitchingChain ? 'Switching...' : `Switch to ${selectedNetwork.displayName}` }}
				</button>
			</div>
			<div v-if="switchChainError" class="text-red-500 text-sm mt-2">{{ switchChainError }}</div>
		</div>

		<!-- Counter Demo Section -->
		<div class="border-t pt-5">
			<div class="flex flex-col gap-1 mb-3">
				<h3 class="text-lg font-semibold">Counter</h3>
				<div class="flex items-center gap-2">
					<span v-if="isLoadingCounter" class="text-sm text-gray-500">Loading...</span>
					<span v-else-if="counterError" class="text-sm text-red-500">Error reading value</span>
					<span v-else-if="counterValue !== null" class="text-lg">
						{{ counterValue.toString() }}
					</span>
					<button
						v-if="!isLoadingCounter"
						@click="readCounterValue"
						class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
						title="Refresh counter value"
					>
						↻
					</button>
				</div>
			</div>

			<div class="flex flex-col gap-3">
				<div>
					<button
						:class="[
							'btn',
							{
								'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400':
									isChainMismatch || !isConnected,
								'opacity-75 cursor-not-allowed': isIncrementing,
							},
						]"
						@click="onClickIncrement"
						:disabled="isIncrementing || isChainMismatch || !isConnected"
					>
						{{ isIncrementing ? 'Incrementing...' : 'Increment' }}
					</button>
				</div>

				<div v-if="incrementError" class="text-red-500">Error: {{ incrementError }}</div>

				<div v-if="callsStatus" class="">
					<div>Status: {{ callsStatus }}</div>
					<div v-if="transactionHash" class="break-all">Transaction: {{ transactionHash }}</div>
				</div>
			</div>
		</div>
	</div>
</template>
