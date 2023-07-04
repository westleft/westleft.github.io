---
layout: doc
---

<script setup>
import { data as posts } from './posts.data.js'
import { computed } from 'vue'

</script>

<h1>所有文章</h1>
<ul>
  <li v-for="post of posts" v-show="post.date">
    <a :href="post.url">{{ post.title }}</a>  （{{ (post.date)?.slice(0,10) }}）
  </li>
</ul>
