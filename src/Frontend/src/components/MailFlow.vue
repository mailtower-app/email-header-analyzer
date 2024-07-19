<script setup lang="ts">

import { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts'
import { computed } from 'vue'

interface Props {
  receivedHeaders: ReceivedHeaderParts[]
}

const maxItemsPerRow = 6
const boxWidth = 110
const boxHeight = 40
const paddingRight = 5
const paddingBottom = 5

const props = defineProps<Props>()

const requiredRows = computed(() => {
  return Math.ceil(props.receivedHeaders.length / maxItemsPerRow)
})

const svgHeight = computed(() => {
  return requiredRows.value * (boxHeight + paddingBottom)
})

function svgReceiveTranslate (index: number) : string {
  const factor = Math.floor(index / maxItemsPerRow)

  const y = factor * (boxHeight + paddingBottom)
  const x = (index % maxItemsPerRow) * (boxWidth + paddingRight)

  return `translate(${x}, ${y})`
}

</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xml:space="preserve"
    width="100%"
    :height="svgHeight"
    version="1.1"
    style="width:100%;height:100%;"
    :viewBox="`0 0 700 ${svgHeight}`"
  >
    <g
      v-for="(received, index) in receivedHeaders"
      :key="index"
      :transform="svgReceiveTranslate(index)"
    >
      <path
        d="M 1,1 L 1,10 L 10,10, 10,1 Z"
        vector-effect="non-scaling-stroke"
        shape-rendering="crispEdges"
        style="fill:#263238;"
      />
      <text
        x="5"
        y="5.5"
        dominant-baseline="middle"
        text-anchor="middle"
        style="font:normal 4px sans-serif; fill: #fff;"
      >{{ index + 1 }}</text>
      <path
        d="M 1,1 L 110,1 L 110,40 L 1,40 Z"
        vector-effect="non-scaling-stroke"
        shape-rendering="crispEdges"
        style="fill:none;stroke:#263238;stroke-width:1px;"
      />
      <path
        v-if="index < receivedHeaders.length - 1"
        d="M 111,15 L 115,20 L 111,25 Z"
        style="fill:#aaa;stroke:#888;stroke-width:.3;"
      />
      <text
        x="4"
        y="20"
        style="font:bold 4px sans-serif; fill: #666;"
      >{{ received.byDomain }}</text>
      <text
        x="4"
        y="26"
        style="font:normal 4px sans-serif; fill: #666;"
      >{{ received.byIpAddress }}</text>

      <text
        x="4"
        y="32"
        style="font:normal 4px sans-serif; fill: #666;"
      >{{ received.with?.slice(0,50) }}</text>
    </g>
  </svg>
</template>
