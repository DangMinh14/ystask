import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../components/layout/PublicShell.vue'),
      children: [
        { path: '', name: 'home', component: () => import('../views/HomeView.vue') },
        {
          path: 'tools/:toolId',
          name: 'tool',
          component: () => import('../features/tools/ToolPage.vue'),
        },
      ],
    },
    {
      path: '/auth',
      component: () => import('../views/auth/AuthLayout.vue'),
      meta: { guestOnly: true },
      children: [
        { path: 'login', name: 'login', component: () => import('../views/auth/LoginView.vue') },
        { path: 'register', name: 'register', component: () => import('../views/auth/RegisterView.vue') },
      ],
    },
    {
      path: '/app',
      component: () => import('../components/layout/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/app/DashboardView.vue') },
        { path: 'habits', name: 'habits', component: () => import('../views/app/HabitsView.vue') },
        { path: 'expenses', name: 'expenses', component: () => import('../views/app/ExpensesView.vue') },
        { path: 'jobs', name: 'jobs', component: () => import('../views/app/JobsView.vue') },
        {
          path: 'admin',
          name: 'admin',
          component: () => import('../views/app/AdminView.vue'),
          meta: { requiresAdmin: true },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
  ],
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 80, behavior: 'smooth' }
    return { top: 0 }
  },
})

// Role-based route protection.
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'dashboard' }
  }
  if (to.matched.some((r) => r.meta.guestOnly) && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
