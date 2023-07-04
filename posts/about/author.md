---
layout: page
---
<script setup>
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers
} from 'vitepress/theme'

const members = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/78782311?v=4',
    name: '佐料',
    title: '努力，不一定會成功；但不努力，一定會很舒服',
    links: [
      { icon: 'github', link: 'https://github.com/westleft' }
    ]
  }
]
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      關於作者
    </template>
    <template #lead>
      Hi，我是佐料。<br>
      平時有在經營另一個 日本／日文的相關部落格
      <a class="about__link" target="_blank" href="https://nerdcc.com">「宅男阿西」</a>
      <br><br>
      因為不想把所有文章混在一起，加上一直想要有一個 .dev 的網域，就趁這個機會開了這個部落格。
      <br><br>
      這裡主要是放筆記跟廢文，如果想要聯絡我可以透過上面部落格的表單中寄信給我 🥺
    </template>
  </VPTeamPageTitle>
  <VPTeamMembers
    :members="members"
  />
</VPTeamPage>

<style>
.about__link {
  color: #42a6ff;
}
</style>