<template>
    <div>
        <h2 style="text-align: center">Users</h2>

        Region:
        <Select v-model="region" style="width:200px" @on-change="onConditionChange">
            <Option value="all">All</Option>
            <Option value="Beijing">Beijing</Option>
            <Option value="Hong Kong">Hong Kong</Option>
        </Select>

        Language:
        <Select v-model="language" style="width:200px" @on-change="onConditionChange">
            <Option value="all">All</Option>
            <Option value="zh">zh</Option>
            <Option value="en">en</Option>
        </Select>

        Gender:
        <Select v-model="gender" style="width:200px" @on-change="onConditionChange">
            <Option value="all">All</Option>
            <Option value="male">Male</Option>
            <Option value="female">Female</Option>
        </Select>

        <Table stripe border :columns="columns" :data="users"></Table><br/>
        <Page :current="page" :page-size="page_size" :total="total_count" show-sizer show-total @on-change="onPageChange" @on-page-size-change="onPageSizeChange" >
            <slot>total {{ total_count }} records</slot>
        </Page>
    </div>
</template>

<script>
import http from '@/http';

export default {
    name: 'Users',
    data () {
        return {
            region: 'all',
            language: 'all',
            gender: 'all',

            page: 1,
            page_size: 10,
            total_count: 0,

            users: [],
            columns: [
                {
                    title: 'ID',
                    key: 'uid'
                },
                {
                    title: 'Name',
                    key: 'name',
                    render: (h, params) => {
                        return h('router-link', {
                            props: {
                                to: {
                                    name: 'User',
                                    params: {
                                        uid: params.row.uid
                                    }
                                }
                            }
                        }, params.row.name);
                    }
                },
                {
                    title: 'Gender',
                    key: 'gender'
                },
                {
                    title: 'Email',
                    key: 'email'
                },
                {
                    title: 'Phone',
                    key: 'phone'
                },
                {
                    title: 'Language',
                    key: 'language'
                },
                {
                    title: 'Region',
                    key: 'region'
                }
            ]
        };
    },
    async created () {
        await this.update();
    },
    methods: {
        async update () {
            let query = {page_size: this.page_size, page: this.page};
            if (this.region !== 'all') query.region = this.region;
            if (this.language !== 'all') query.language = this.language;
            if (this.gender !== 'all') query.gender = this.gender;
            let res = await http.get('users', query);
            this.users = res.data.users;
            this.total_count = res.data.total_count;
            this.page = res.data.page;
        },
        async onPageChange (page) {
            this.page = page;
            await this.update();
        },
        async onPageSizeChange (page_size) {
            this.page = 1;
            this.page_size = page_size;
            await this.update();
        },
        async onConditionChange () {
            this.page = 1;
            await this.update();
        }
    }
};
</script>
