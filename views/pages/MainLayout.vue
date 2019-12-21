<template>
    <div>
        <Layout style="min-height: 100vh">
            <Header>
                <h2 style="color: #c7eaa8; text-align: center">Blogs</h2>
            </Header>
            <Layout>
                <Sider hide-trigger :style="{background: '#fff'}">
                    <Menu theme="light" width="auto">
                        <MenuItem name="index" :to="{name: 'Index'}"><Icon type="ios-home" />Home</MenuItem>
                        <MenuItem name="articles" :to="{name: 'Articles'}"><Icon type="ios-home" />Articles</MenuItem>
                        <MenuItem name="users" :to="{name: 'Users'}"><Icon type="ios-home" />Users</MenuItem>
                    </Menu>
                </Sider>
                <Layout :style="{padding: '24px 24px 24px'}">
                    <Content
                        :style="{padding: '24px 24px', minHeight: '280px', background: '#fff'}"
                    >
                        <router-view />
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    </div>
</template>

<script>
export default {
    name: 'MainLayout'
};
</script>
