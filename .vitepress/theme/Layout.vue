<template>
  <Layout>
    <template #doc-after>
      <Giscus />
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import DefaultTheme from 'vitepress/theme'
import Giscus from '../components/Giscus.vue'

const { Layout } = DefaultTheme
</script>