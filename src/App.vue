<script setup lang="ts">
import { VueDappModal } from '@vue-dapp/modal'
import '@vue-dapp/modal/dist/style.css'
import { announceSAManagerProvider } from '@samanager/sdk'
import { BrowserWalletConnector, useVueDapp } from '@vue-dapp/core'

const { connectors, addConnectors } = useVueDapp()

onMounted(() => {
	if (!connectors.value.find(connector => connector.name === 'BrowserWallet')) {
		addConnectors([new BrowserWalletConnector()])
	}

	announceSAManagerProvider({
		debug: true,
		origin: 'http://localhost:5173',
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
