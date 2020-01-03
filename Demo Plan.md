# Demo Plan

## Normal

1. `Articles`: show article list, includes Title, Category, Language, ReadNum
2. `Articles`: change Category and Language filter
3. `Articles`: show total records, change page
4. `Article Detail`: click into an article, show it's Abstract, Content, Image, Comments
5. `Article Detail`: refresh page, see ReadNum increase
6. `Article Detail`: switch to article 38, show video
7. `Users`: show user list, includes Name, Gender, Email
8. `Users`: change Region and Language filters
9. `Users`: show total records, change page
10. `User read articles`: click into an user, see read article, click article, see article detail
11. `Popular Articles`: change Category, TemporalGranularity filter, see Authors, Language

## Admin

open admin page left side, articles page right side

1. show db record num, location, status and **workload**
2. refresh an article, show read count increase with different DB type
3. click insert article, show article count increase

Next I will show you that how does our system find db status change.

1. stop a backup db, show admin page change
2. refresh articles
3. start same backup db, show admin page change
4. stop a master db, show admin page change
5. refresh articles
6. add an new db, show admin page change

