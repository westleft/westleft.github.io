import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: '調味生活',
  description: '你需要的佐料都在這裡。',
  // head: [
  //   ['script', {src: 'https://googletagmanager.com/...'}],
  //   ['script', {}, `gtag call here`]
  // ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '../assets/images/logo.png',

    nav: [
      { text: '所有文章', link: '/posts/' },
      { text: '關於作者', link: '/posts/about/author' },
    ],

    sidebar: [
      {
        text: '文章列表',
        items: [
          {
            text: '🚀 前端',
            items: [
              {
                text: 'JavaScript',
                collapsed: true,
                items: [
                  { text: 'Promise', link: '/posts/frontend/javascript/promise' },
                ]
              },
              {
                text: 'TypeScript',
                collapsed: true,
                items: [
                  { text: '練習 TS 中的 class', link: '/posts/frontend/typescript/class' },
                ]
              },{
                text: 'Vue',
                collapsed: true,
                items: [
                ]
              }
            ]
          },{
            text: '🚁 區塊鏈',
            items: [
              {
                text: 'Solidity',
                collapsed: true,
                items: [
                ]
              },{
                text: 'GameFi',
                collapsed: true,
                items: [
                ]
              }
            ]
          },{
            text: '🪂 廢文',
            collapsed: true,
            items: [
              { text: 'Introduction', link: '/guide/' },
              { text: 'Introduction', link: '/guide/' }
            ]
          }
        ]
      }
    ],

    // socialLinks: [
    //   { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    // ]
  }
})
