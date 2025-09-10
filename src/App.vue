<script setup lang="ts">
import { announceSAManagerProvider } from '@samanager/sdk'
import { BrowserWalletConnector, useVueDapp } from '@vue-dapp/core'
import { VueDappModal } from '@vue-dapp/modal'
import '@vue-dapp/modal/dist/style.css'

const { connectors, addConnectors } = useVueDapp()

let samanagerOrigin = 'http://localhost:5173'
if (import.meta.env.PROD) {
	samanagerOrigin = 'https://testnet.samanager.xyz'
}

onMounted(() => {
	if (!connectors.value.find(connector => connector.name === 'BrowserWallet')) {
		addConnectors([new BrowserWalletConnector()])
	}

	announceSAManagerProvider({
		debug: true,
		origin: samanagerOrigin,
	})
})
</script>

<template>
	<div>
		<header class="flex items-center p-4 gap-4">
			<RouterLink class="underline" to="/">Home</RouterLink>
			<RouterLink class="underline" to="/rpc">RPC</RouterLink>
		</header>
		<RouterView />
	</div>
	<VueDappModal dark auto-connect />
</template>

<style lang="css" scoped></style>
