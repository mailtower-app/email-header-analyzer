<script setup lang="ts">

interface Props {
  from?: string
  to?: string
  subject?: string
  returnPath?: string
}

defineProps<Props>()

</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xml:space="preserve"
    width="100%"
    height="600"
    version="1.1"
    viewBox="0 0 32 32"
  >
    <g id="mail"><path
      d="m2.43 29.04 13.55-9.88 13.55 9.88"
      style="fill:none;stroke:#263238;stroke-width:.8;stroke-dasharray:none;"
    /><path
      d="m2.43 13.55 3.25-2.35"
      style="fill:none;stroke:#263238;stroke-width:.8;stroke-dasharray:none;"
    /><path
      d="m26.48 11.2 3.05 2.46"
      style="fill:none;stroke:#263238;stroke-width:.8;stroke-dasharray:none;"
    /><path
      d="M5.48 15.94c.12-.3 0-14.43 0-14.43H20.5l6.15 6.15v8.13"
      style="fill:none;stroke:#666666;stroke-width:.8;"
    /><path
      d="M7 12 20 12 Z"
      style="fill:none;stroke:#CCCCCC;stroke-width:.3;"
    /><path
      d="M7 14 24 14 Z"
      style="fill:none;stroke:#CCCCCC;stroke-width:.3;"
    /><path
      d="M7 16 24 16 Z"
      style="fill:none;stroke:#CCCCCC;stroke-width:.3;"
    /><path
      d="m11.6 20.16-9.17-6.61v16.87h27.1V13.66l-9.09 6.5"
      style="fill:none;stroke:#263238;stroke-width:.8;stroke-linejoin:round;"
    /></g>

    <!-- <g>
      <circle
        cx="23.5"
        cy="9"
        r="2"
        fill="gold"
      /><text
        x="22.5"
        y="9.2"
        style="font:normal 0.5px sans-serif; fill: #666;;"
      >Signature</text>
    </g> -->

    <g
      id="letter"
      transform="translate(0,-2)"
    >
      <text
        x="7"
        y="5.9"
        style="font:normal 0.5px sans-serif; fill: #666;;"
      >From</text>
      <text
        x="7"
        y="6.8"
        style="font:normal 0.7px sans-serif;"
      >{{ from?.slice(0, 45) }}</text>

      <text
        x="7"
        y="7.6"
        style="font:normal 0.5px sans-serif; fill: #666;;"
      >To</text>
      <text
        x="7"
        y="8.5"
        style="font:normal 0.7px sans-serif;"
      >{{ to?.slice(0, 45) }}</text>

      <text
        x="7"
        y="12"
        style="font:normal 0.7px sans-serif; font-weight: bold;"
      >{{ subject?.slice(0, 50) }}</text>
    </g>

    <g>
      <text
        x="16"
        y="26"
        dominant-baseline="middle"
        text-anchor="middle"
        style="font:normal 0.5px sans-serif; fill: #666;;"
      >ReturnPath</text>
      <text
        x="16"
        y="27"
        dominant-baseline="middle"
        text-anchor="middle"
        style="font:italic 1.0px sans-serif;"
      >{{ returnPath }}</text>
    </g>
  </svg>
</template>
