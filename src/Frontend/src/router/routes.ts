import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        // The analyzer is the start page
        name: 'home',
        path: '',
        redirect: { name: 'analyzer' },
      },
      {
        name: 'analyzer',
        path: 'header-analyzer',
        component: () => import('@/pages/AnalyzerPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
