import Vue from 'vue';
import Router from 'vue-router';

import MainLayout from '@/pages/MainLayout';

import Index from '@/pages/Index';
import Popular from '@/pages/Popular';
import Articles from '@/pages/Articles';
import Article from '@/pages/Article';
import Users from '@/pages/Users';
import User from '@/pages/User';
import Admin from '@/pages/Admin';

Vue.use(Router);

export default new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            component: MainLayout,
            children: [
                {
                    path: '',
                    name: 'Index',
                    component: Index
                },
                {
                    path: 'articles',
                    name: 'Articles',
                    component: Articles
                },
                {
                    path: 'popular_articles',
                    name: 'Popular',
                    component: Popular
                },
                {
                    path: 'article/:aid',
                    name: 'Article',
                    component: Article
                },
                {
                    path: 'users',
                    name: 'Users',
                    component: Users
                },
                {
                    path: 'user/:uid',
                    name: 'User',
                    component: User
                },
                {
                    path: 'admin',
                    name: 'Admin',
                    component: Admin
                }
            ]
        }
    ]
});
