import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import { sepolia, baseSepolia, arbitrumSepolia, type Chain } from 'viem/chains'

export interface NetworkConfig {
	id: number
	name: string
	displayName: string
	chain: Chain
	rpcUrl: string
	blockExplorer: string
	color: string
}

export const NETWORKS: Record<string, NetworkConfig> = {
	sepolia: {
		id: sepolia.id,
		name: 'sepolia',
		displayName: 'Sepolia',
		chain: sepolia,
		rpcUrl: sepolia.rpcUrls.default.http[0],
		blockExplorer: sepolia.blockExplorers?.default.url || '',
		color: '#627EEA',
	},
	baseSepolia: {
		id: baseSepolia.id,
		name: 'base-sepolia',
		displayName: 'Base Sepolia',
		chain: baseSepolia,
		rpcUrl: baseSepolia.rpcUrls.default.http[0],
		blockExplorer: baseSepolia.blockExplorers?.default.url || '',
		color: '#0052FF',
	},
	arbitrumSepolia: {
		id: arbitrumSepolia.id,
		name: 'arbitrum-sepolia',
		displayName: 'Arbitrum Sepolia',
		chain: arbitrumSepolia,
		rpcUrl: arbitrumSepolia.rpcUrls.default.http[0],
		blockExplorer: arbitrumSepolia.blockExplorers?.default.url || '',
		color: '#28A0F0',
	},
}

export const useBlockchainStore = defineStore('useBlockchainStore', () => {
	const selectedNetwork = ref<NetworkConfig>(NETWORKS.baseSepolia)

	const availableNetworks = computed(() => Object.values(NETWORKS))

	const setNetwork = (networkName: string) => {
		const network = NETWORKS[networkName]
		if (network) {
			selectedNetwork.value = network
		}
	}

	return {
		selectedNetwork,
		availableNetworks,
		setNetwork,
	}
})

export function useBlockchain() {
	const store = useBlockchainStore()
	return {
		...store,
		...storeToRefs(store),
	}
}
