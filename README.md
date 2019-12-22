# ddbms

FIXME: in genTable_mongoDB10G.py, line 78

## 架构

数据库：选用MongoDB，自己实现了一个管理工具gate

非结构化数据：储存在HDFS中

后端：Nodejs+Koa

前端：Webpack+Vue

说明：

前端负责展示数据，与后端进行通信。

后端处理前端发来的请求，向gate请求相应数据

如果前端想后端请求非结构数据，则后端访问HDFS获取输出发送给前端

gate分析数据请求，决定查询和修改哪些MongoDB

## 实现的功能

* Bulk load User table, Article table, and Read table into the data center
* Query users, articles, users’ read tables (involving the join of User table and Article table) with and without query conditions
* Populate the empty Be-Read table by inserting newly computed records into the Be-Read table.
* Query the top-5 daily/weekly/monthly popular articles with articles details (text, image, and video if existing) (involving the join of Be-Read table and Article table)

* Efficient execution of data insert, update, and queries
* Monitoring the running status of DBMS servers, including its managed data(amount and location) & workload.
* Hot Standby DBMSs for fault tolerance
* Expansion at the DBMS-level allowing a new DBMS server to join
* Dropping a DBMS server at will
* [Data import & data export]Data migration from one data center to others
