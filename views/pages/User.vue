<template>
    <div>
        <h2 style="text-align: center">User:{{user.name}}</h2>
        <Card>
            <Tag color="primary">Gender: {{ user.gender }}</Tag>
            <Tag color="success">Email: {{ user.email }}</Tag>
            <Tag color="warning">Phone: {{ user.phone }}</Tag>
            <Tag color="default">Language: {{ user.language }}</Tag>
            <Tag color="volcano">Region: {{ user.region }}</Tag>
            <Tag color="error">Role: {{ user.role }}</Tag>
        </Card>
        <br/>
        <Card>
            <p slot="title">Read Articles</p>
            <Table stripe border :columns="columns" :data="user.reads || []"></Table>
        </Card>
        <br/>
    </div>
</template>

<script>
import http from '@/http';

export default {
    name: 'User',
    data () {
        return {
            user: {},
            columns: [
                {
                    title: 'ID',
                    key: 'aid'
                },
                {
                    title: 'Title',
                    key: 'title',
                    render: (h, params) => {
                        return h('router-link', {
                            props: {
                                to: {
                                    name: 'Article',
                                    params: {
                                        aid: params.row.aid
                                    }
                                }
                            }
                        }, params.row.title);
                    }
                },
                {
                    title: 'Category',
                    key: 'category'
                },
                {
                    title: 'ReadTimeLength',
                    key: 'readTimeLength'
                },
                {
                    title: 'Language',
                    key: 'language'
                },
                {
                    title: 'ReadOrNot',
                    key: 'readOrNot'
                },
                {
                    title: 'AgreeOrNot',
                    key: 'agreeOrNot'
                },
                {
                    title: 'CommentOrNot',
                    key: 'commentOrNot'
                },
                {
                    title: 'ShareOrNot',
                    key: 'shareOrNot'
                }
            ]
        };
    },
    async created () {
        let res = await http.get('user', {uid: this.$route.params.uid});
        this.user = res.data;
    }
};
</script>
