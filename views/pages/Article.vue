<template>
    <div>
        <h2 style="text-align: center">Article:{{article.title}}</h2>
        <Card>
            <Tag color="primary">Category: {{ article.category }}</Tag>
            <Tag color="success">Tags: {{ article.articleTags }}</Tag>
            <Tag color="warning">Authors: {{ article.authors }}</Tag>
            <Tag color="default">Language: {{ article.language }}</Tag>
            <Tag color="red">ReadNum: {{ article.readNum }}</Tag>
            <Tag color="orange">CommentNum: {{ article.commentNum }}</Tag>
            <Tag color="gold">AgreeNum: {{ article.agreeNum }}</Tag>
            <Tag color="cyan">ShareNum: {{ article.shareNum }}</Tag>
        </Card>
        <br/>
        <Card>
            <p slot="title">Abstract</p>
            <p>{{ article.abstract }}</p>
        </Card>
        <br/>
        <Card>
            <p slot="title">Content</p>
            <p style="word-wrap:break-word; word-break:break-all;">{{ text }}</p>
        </Card>
        <br/>
        <Card>
            <p slot="title">Image</p>
            <p style="text-align: center">
                <img v-for="url in images" :key="url" :src="url" style="margin: 10px"/>
            </p>
        </Card>
        <br/>
        <Card>
            <p slot="title">Video</p>
            <p v-if="!video_url">None</p>
            <p v-show="video_url" style="text-align: center">
                <video ref="video"> </video><br/>
                <span style="text-align: center">
                    <Button @click="onPlay">Play</Button>
                    <Button @click="onPause">Pause</Button>
                </span>
            </p>
        </Card>
        <br/>
        <Card>
            <p slot="title">Comments</p>
            <List border>
                <ListItem v-if="comments.length == 0">No comment.</ListItem>
                <ListItem v-for="comment in comments" :key="comment.id">
                    {{ comment.name }}[{{ strify(comment.timestamp) }}] : {{ comment.commentDetail }}
                </ListItem>
            </List>
        </Card>
        <br/>
    </div>
</template>

<script>
import http from '@/http';
import flvjs from 'flv.js';
import moment from 'moment';

export default {
    name: 'Article',
    data () {
        return {
            article: {},
            comments: [],
            text: '',
            images: [],
            video_url: null,
            flvPlayer: null
        };
    },
    async created () {
        let res = await http.get('article', {aid: this.$route.params.aid});
        this.article = res.data;
        if (this.article.text) {
            res = await http.get_plain(`article_text/${this.$route.params.aid}/${this.article.text}`);
            this.text = res;
        }
        if (this.article.image) {
            let images = [];
            for (let image of this.article.image.split(',')) {
                image = image.trim();
                if (image.length === 0) continue;
                images.push(`${http.baseURL}article_image/${this.$route.params.aid}/${image}`);
            }
            this.images = images;
        }
        if (this.article.video) {
            this.video_url = `${http.baseURL}article_video/${this.$route.params.aid}/${this.article.video}`;
            console.log(this.$refs['video']);
            let flvPlayer = flvjs.createPlayer({
                type: 'flv',
                url: this.video_url
            }, {
                lazyLoadMaxDuration: 60 * 60 * 60
            });
            flvPlayer.attachMediaElement(this.$refs['video']);
            flvPlayer.load();
            this.flvPlayer = flvPlayer;
        }
        res = await http.get('article_comments', {aid: this.$route.params.aid});
        this.comments = res.data;
    },
    methods: {
        strify (date) {
            return moment(date).format('YYYY-MM-DD HH:mm');
        },
        onPlay () {
            this.flvPlayer.play();
        },
        onPause () {
            this.flvPlayer.pause();
        }
    }
};
</script>
