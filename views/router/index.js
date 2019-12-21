import Vue from 'vue';
import Router from 'vue-router';

import MainLayout from '@/pages/MainLayout';

import Index from '@/pages/Index';
import Articles from '@/pages/Articles';
import Article from '@/pages/Article';
import Users from '@/pages/Users';
import User from '@/pages/User';

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
                }
            ]
        }
    ]
});
