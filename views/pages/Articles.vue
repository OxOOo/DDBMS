<template>
    <div>
        <h2 style="text-align: center">Articles</h2>

        Category:
        <Select v-model="category" style="width:200px" @on-change="onConditionChange">
            <Option value="all">All</Option>
            <Option value="science">Science</Option>
            <Option value="technology">Technology</Option>
        </Select>

        Language:
        <Select v-model="language" style="width:200px" @on-change="onConditionChange">
            <Option value="all">All</Option>
            <Option value="zh">zh</Option>
            <Option value="en">en</Option>
        </Select>

        <Button @click="genArticle">Insert A Random Article</Button>

        <br/>

        <Table stripe border :columns="columns" :data="articles"></Table><br/>
        <Page :current="page" :page-size="page_size" :total="total_count" show-sizer show-total @on-change="onPageChange" @on-page-size-change="onPageSizeChange" >
            <slot>total {{ total_count }} records</slot>
        </Page>
    </div>
</template>

<script>
import http from '@/http';

export default {
    name: 'Articles',
    data () {
        return {
            category: 'all',
            language: 'all',

            page: 1,
            page_size: 10,
            total_count: 0,

            articles: [],
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
                    title: 'Authors',
                    key: 'authors'
                },
                {
                    title: 'Language',
                    key: 'language'
                },
                {
                    title: 'ArticleTags',
                    key: 'articleTags'
                },
                {
                    title: 'ReadNum',
                    key: 'readNum'
                },
                {
                    title: 'CommentNum',
                    key: 'commentNum'
                },
                {
                    title: 'AgreeNum',
                    key: 'agreeNum'
                },
                {
                    title: 'ShareNum',
                    key: 'shareNum'
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
            if (this.category !== 'all') query.category = this.category;
            if (this.language !== 'all') query.language = this.language;
            let res = await http.get('articles', query);
            this.articles = res.data.articles;
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
        },
        async genArticle () {
            await http.post('gen_random_article');
            await this.update();
            this.$Message.success('success inserted an article');
        }
    }
};
</script>
