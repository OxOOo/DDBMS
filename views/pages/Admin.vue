<template>
    <div>
        <h2 style="text-align: center">Admin</h2>

        <Table stripe border :columns="columns" :data="dbs"></Table><br/>

        <Card>
            <p slot="title">Add DBMS</p>
            <Form inline>
                <FormItem prop="db_host">
                    <Input type="text" v-model="db_host" placeholder="DB HOST">
                    </Input>
                </FormItem>
                <FormItem prop="db_type">
                    <Select v-model="db_type">
                        <Option value="DBMS1">Type 1</Option>
                        <Option value="DBMS2">Type 2</Option>
                    </Select>
                </FormItem>
                <FormItem>
                    <Button type="primary" @click="handleSubmit()">Add</Button>
                </FormItem>
            </Form>
        </Card>
    </div>
</template>

<script>
import http from '@/http';

export default {
    name: 'Admin',
    data () {
        return {
            db_host: '',
            db_type: '',

            dbs: [],
            columns: [
                {
                    title: 'Host',
                    key: 'host',
                    minWidth: 100,
                    render: (h, params) => {
                        let items = [];
                        items.push(h('span', {
                            style: {
                                margin: '10px'
                            }
                        }, params.row.host));
                        if (params.row.is_alive) {
                            if (params.row.is_master) {
                                items.push(h('Tag', {
                                    props: {
                                        color: 'success'
                                    }
                                }, 'Master'));
                            } else {
                                items.push(h('Tag', {
                                    props: {
                                        color: 'warning'
                                    }
                                }, 'Backup'));
                            }
                        } else {
                            items.push(h('Tag', {
                                props: {
                                    color: 'error'
                                }
                            }, 'Dead'));
                        }
                        return h('div', items);
                    }
                },
                {
                    title: 'Type',
                    key: 'type',
                    render: (h, params) => {
                        let map = {
                            DBMS1: 'Type 1',
                            DBMS2: 'Type 2'
                        };
                        return h('span', map[params.row.type]);
                    }
                },
                {
                    title: 'IP',
                    key: 'ip'
                },
                {
                    title: 'Uptime',
                    key: 'uptime'
                },
                {
                    title: 'Article Count',
                    key: 'article_count'
                },
                {
                    title: 'BeRead Count',
                    key: 'beread_count'
                },
                {
                    title: 'Rank Count',
                    key: 'rank_count'
                },
                {
                    title: 'Read Count',
                    key: 'read_count'
                },
                {
                    title: 'User Count',
                    key: 'user_count'
                },
                {
                    title: '[Workload]query',
                    key: 'workload_read_count'
                },
                {
                    title: '[Workload]modify',
                    key: 'workload_modify_count'
                }
            ]
        };
    },
    async created () {
        await this.update();
        setInterval(() => {
            this.update();
        }, 100);
    },
    methods: {
        async update () {
            let res = await http.get('admin/dbstatus');
            this.dbs = res.data;
        },
        async handleSubmit () {
            if (!this.db_host) {
                return this.$Message.error('no db host');
            }
            if (this.db_type === 'DBMS1') {
                await http.post('/admin/add_dbms1', {}, {host: this.db_host});
            } else if (this.db_type === 'DBMS2') {
                await http.post('/admin/add_dbms2', {}, {host: this.db_host});
            } else {
                return this.$Message.error('unknow db type');
            }
            this.$Message.success('add db success');
        }
    }
};
</script>
