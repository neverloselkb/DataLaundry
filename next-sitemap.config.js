/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.SITE_URL || 'https://data-laundry.com',
    generateRobotsTxt: true, // robots.txt 자동 생성 옵션
    sitemapSize: 7000,
    outDir: 'out', // Next.js static export 출력 폴더가 'out'이라면 필수 지정
    exclude: ['/icon.png'],
    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
            },
        ],
    },
};
