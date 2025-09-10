<script setup lang="ts">
import { computed } from 'vue'
import { useBlockchain } from '@/stores/useBlockchain'
import { NETWORKS } from '@/stores/useBlockchain'
import Dropdown from './Dropdown.vue'

const { selectedNetwork, setNetwork } = useBlockchain()

// Convert networks to dropdown items using NETWORKS keys
const dropdownItems = computed(() =>
	Object.entries(NETWORKS).map(([key, network]) => ({
		value: key,
		label: network.displayName,
	})),
)

// Handle network selection
const handleNetworkSelect = (networkName: string) => {
	setNetwork(networkName)
}
</script>

<template>
	<Dropdown :button-text="selectedNetwork.displayName" :items="dropdownItems" @select="handleNetworkSelect" />
</template>

<style lang="css" scoped></style>
