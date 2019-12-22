<template>
    <div>
        <h2 style="text-align: center">Popular Articles</h2>

        Category:
        <Select v-model="category" style="width:200px" @on-change="onConditionChange">
            <Option value="science">Science</Option>
            <Option value="technology">Technology</Option>
        </Select>

        TemporalGranularity:
        <Select v-model="temporalGranularity" style="width:200px" @on-change="onConditionChange">
            <Option value="daily">Daily</Option>
            <Option value="weekly">Weekly</Option>
            <Option value="monthly">Monthly</Option>
        </Select>

        <Table stripe border :columns="columns" :data="articles"></Table>
    </div>
</template>

<script>
import http from '@/http';

export default {
    name: 'PopularArticles',
    data () {
        return {
            category: 'science',
            temporalGranularity: 'daily',

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
                    title: 'ReadNum',
                    key: 'readNum'
                }
            ]
        };
    },
    async created () {
        await this.update();
    },
    methods: {
        async update () {
            let query = {};
            query.category = this.category;
            query.temporalGranularity = this.temporalGranularity;
            let res = await http.get('popular_articles', query);
            this.articles = res.data;
        },
        async onConditionChange () {
            this.page = 1;
            await this.update();
        }
    }
};
</script>
