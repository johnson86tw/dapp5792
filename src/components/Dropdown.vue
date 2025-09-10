<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

interface Props {
	buttonText: string
	items: Array<{ value: string; label: string }>
	modelValue?: string
}

interface Emits {
	(e: 'select', value: string): void
}

const _props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = ref(false)
const dropdownRef = ref(null)

// Close dropdown when clicking outside
onClickOutside(dropdownRef, () => {
	isOpen.value = false
})

const toggleDropdown = () => {
	isOpen.value = !isOpen.value
}

const selectItem = (value: string) => {
	emit('select', value)
	isOpen.value = false
}
</script>

<template>
	<div class="relative inline-block" ref="dropdownRef">
		<button @click="toggleDropdown" class="btn inline-flex items-center" type="button">
			{{ buttonText }}
			<svg
				class="w-2.5 h-2.5 ms-3 transition-transform duration-200"
				:class="{ 'rotate-180': isOpen }"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 10 6"
			>
				<path
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="m1 1 4 4 4-4"
				/>
			</svg>
		</button>

		<!-- Dropdown menu -->
		<div
			v-if="isOpen"
			class="z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44 dark:bg-gray-700 absolute top-full left-0 mt-1"
		>
			<ul class="py-2 text-sm text-gray-700 dark:text-gray-200">
				<li v-for="item in items" :key="item.value">
					<a
						href="#"
						@click.prevent="selectItem(item.value)"
						class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
					>
						{{ item.label }}
					</a>
				</li>
			</ul>
		</div>
	</div>
</template>

<style lang="css" scoped></style>
