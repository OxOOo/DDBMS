<template>
    <div>
        <h2 style="text-align: center">Article:{{article.title}}</h2>
        <Card>
            <Tag color="primary">Category: {{ article.category }}</Tag>
            <Tag color="success">Tags: {{ article.articleTags }}</Tag>
            <Tag color="warning">Authors: {{ article.authors }}</Tag>
            <Tag color="default">Language: {{ article.language }}</Tag>
        </Card>
        <br/>
        <Card>
            <p slot="title">Abstract</p>
            <p>{{ article.abstract }}</p>
        </Card>
        <br/>
        <Card>
            <p slot="title">Content</p>
            <p>{{ article.text }}</p>
        </Card>
        <br/>
        <Card>
            <p slot="title">Image</p>
            <p>{{ article.image }}</p>
        </Card>
        <br/>
        <Card>
            <p slot="title">Video</p>
            <p>{{ article.video }}</p>
        </Card>
        <br/>
        <Card>
            <p slot="title">Comments</p>
            <p>{{ article.video }}</p>
        </Card>
        <br/>
    </div>
</template>

<script>
import http from '@/http';

export default {
    name: 'Article',
    data () {
        return {
            article: {}
        };
    },
    async created () {
        let res = await http.get('article', {aid: this.$route.params.aid});
        this.article = res.data;
    }
};
</script>
