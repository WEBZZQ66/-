<template>
    <div class="kb-page">
        <FrontBanner
            title="知识库"
            subtitle="精选心理健康文章，陪你慢慢了解自己"
            icon="Reading"
        />

        <!-- 未登录 -->
        <PageState
            v-if="!loggedIn"
            type="lock"
            text="登录后即可阅读知识文章"
            action-text="去登录"
            @action="goLogin"
        />

        <div v-else class="kb-body">
            <!-- 左侧：推荐阅读 -->
            <aside class="kb-side">
                <div class="side-card">
                    <div class="side-head">
                        <span class="side-title">推荐阅读</span>
                        <span class="side-sub">阅读量 Top 10</span>
                    </div>

                    <div v-loading="recommendLoading" class="rank-list">
                        <div
                            v-for="(item, index) in recommends"
                            :key="item.id"
                            class="rank-item"
                            @click="goDetail(item)"
                        >
                            <span class="rank-index" :class="{ top: index < 3 }">{{ index + 1 }}</span>
                            <div class="rank-main">
                                <p class="rank-title">{{ item.title }}</p>
                                <span class="rank-meta">
                                    <el-icon><View /></el-icon>
                                    {{ item.readCount }}
                                </span>
                            </div>
                        </div>

                        <div v-if="!recommendLoading && !recommends.length" class="rank-empty">暂无推荐</div>
                    </div>
                </div>

                <div v-if="history.length" class="side-card history-card">
                    <div class="side-head">
                        <span class="side-title">最近阅读</span>
                        <button type="button" class="clear-btn" @click="clearHistoryAll">清空</button>
                    </div>
                    <div
                        v-for="item in history"
                        :key="item.id"
                        class="rank-item"
                        @click="goDetail(item)"
                    >
                        <div class="rank-main">
                            <p class="rank-title">{{ item.title }}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- 右侧：全部文章 -->
            <section class="kb-main">
                <div class="main-head">
                    <div class="main-title-wrap">
                        <h3 class="main-title">全部文章</h3>
                        <span class="main-count">共 {{ total }} 篇</span>
                    </div>

                    <div class="sort-tabs">
                        <button
                            v-for="tab in SORT_TABS"
                            :key="tab.key"
                            type="button"
                            class="sort-tab"
                            :class="{ on: sortKey === tab.key }"
                            @click="changeSort(tab.key)"
                        >
                            {{ tab.label }}
                        </button>
                    </div>
                </div>

                <div v-loading="loading" class="kb-grid">
                    <article
                        v-for="item in articles"
                        :key="item.id"
                        class="kb-card"
                        @click="goDetail(item)"
                    >
                        <div class="kb-cover">
                            <img v-if="item.cover" :src="item.cover" :alt="item.title" />
                            <div v-else class="cover-placeholder">
                                <el-icon><Reading /></el-icon>
                            </div>
                            <button
                                type="button"
                                class="fav-btn"
                                :class="{ on: item.isFavorited }"
                                :title="item.isFavorited ? '取消收藏' : '收藏'"
                                @click.stop="handleFavorite(item)"
                            >
                                <el-icon>
                                    <StarFilled v-if="item.isFavorited" />
                                    <Star v-else />
                                </el-icon>
                            </button>
                        </div>

                        <div class="kb-info">
                            <h4 class="kb-title">{{ item.title }}</h4>
                            <p class="kb-summary">{{ item.summary || '暂无摘要' }}</p>

                            <div class="kb-meta">
                                <span v-if="item.category" class="meta-category">{{ item.category }}</span>
                                <span class="meta-right">
                                    <el-icon><View /></el-icon>
                                    {{ item.readCount }}
                                    <span class="meta-sep">·</span>
                                    {{ item.timeText }}
                                </span>
                            </div>
                        </div>
                    </article>
                </div>

                <PageState
                    v-if="errorText"
                    type="error"
                    compact
                    :text="errorText"
                    action-text="重新加载"
                    @action="fetchArticles"
                />

                <el-empty
                    v-else-if="!loading && !articles.length"
                    description="暂无文章"
                    :image-size="90"
                />

                <el-pagination
                    v-if="total > pageSize"
                    class="kb-pagination"
                    layout="prev, pager, next"
                    :current-page="currentPage"
                    :page-size="pageSize"
                    :total="total"
                    @current-change="handlePageChange"
                />
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { knowledgeArticlePage } from '@/api/user'
import { getHistory, clearHistory } from '@/utils/readingHistory'
import { isFavorited, toggleFavorite } from '@/utils/favorites'
import FrontBanner from '@/components/FrontBanner.vue'
import PageState from '@/components/PageState.vue'
import { normalizeArticle } from '@/utils/article'

const PAGE_SIZE = 9
const RECOMMEND_SIZE = 10

//按发布时间 / 按阅读量
const SORT_TABS = [
    { key: 'time', label: '最新发布', sortField: 'publishedAt', sortDirection: 'desc' },
    { key: 'read', label: '阅读最多', sortField: 'readCount', sortDirection: 'desc' }
]

const router = useRouter()
const loggedIn = ref(Boolean(localStorage.getItem('token')))

const recommends = ref([])
const recommendLoading = ref(false)

const articles = ref([])
const loading = ref(false)
const errorText = ref('')
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(PAGE_SIZE)
const sortKey = ref('time')

const history = ref(getHistory())

const clearHistoryAll = () => {
    clearHistory()
    history.value = []
}

//收藏 / 取消收藏：后端暂无收藏接口，先记在本地
const handleFavorite = (item) => {
    item.isFavorited = toggleFavorite(item)
    ElMessage.success(item.isFavorited ? '已加入收藏' : '已取消收藏')
}

const goDetail = (item) => router.push(`/knowledge/${item.id}`)
const goLogin = () => router.push({ path: '/auth/login', query: { redirect: '/knowledge' } })

const normalizeList = (data) => {
    const list = Array.isArray(data) ? data : (data?.records ?? data?.list ?? data?.rows ?? [])
    return list.map(raw => {
        const article = normalizeArticle(raw)
        if (!article.title) article.title = '未命名文章'
        //本地收藏优先（后端接口就绪后可改成服务端状态）
        article.isFavorited = isFavorited(article.id) || article.isFavorited
        return article
    })
}

//推荐阅读：按阅读量倒序取前 10
const fetchRecommends = async () => {
    if (!loggedIn.value) return
    recommendLoading.value = true
    try {
        const data = await knowledgeArticlePage({
            sortField: 'readCount',
            sortDirection: 'desc',
            currentPage: 1,
            size: RECOMMEND_SIZE
        })
        recommends.value = normalizeList(data).slice(0, RECOMMEND_SIZE)
    } catch {
        recommends.value = []
    } finally {
        recommendLoading.value = false
    }
}

//全部文章：按当前选中的排序
const fetchArticles = async () => {
    if (!loggedIn.value) return
    loading.value = true
    errorText.value = ''
    try {
        const sort = SORT_TABS.find(tab => tab.key === sortKey.value) ?? SORT_TABS[0]
        const data = await knowledgeArticlePage({
            sortField: sort.sortField,
            sortDirection: sort.sortDirection,
            currentPage: currentPage.value,
            size: pageSize.value
        })
        articles.value = normalizeList(data)
        total.value = Number(data?.total ?? articles.value.length) || articles.value.length
    } catch (error) {
        articles.value = []
        total.value = 0
        errorText.value = `文章加载失败：${error?.message || '请稍后重试'}`
    } finally {
        loading.value = false
    }
}

const changeSort = (key) => {
    if (sortKey.value === key) return
    sortKey.value = key
    currentPage.value = 1
    fetchArticles()
}

const handlePageChange = (page) => {
    currentPage.value = page
    fetchArticles()
}

onMounted(() => {
    if (!loggedIn.value) return
    fetchRecommends()
    fetchArticles()
})
</script>

<style lang="scss" scoped>
.kb-page {
    flex: 1;
    padding: 24px;
    background: var(--bg-page);
    box-sizing: border-box;
}

/* ---------- 两栏布局 ---------- */
.kb-body {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
}

/* ---------- 左侧推荐阅读 ---------- */
.kb-side {
    position: sticky;
    top: 20px;
}

.side-card {
    background: var(--bg-card);
    border-radius: 14px;
    padding: 18px 16px;
    box-shadow: 0 2px 10px rgba(60, 40, 100, 0.05);
}

.side-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 12px;

    .side-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-1);
    }

    .side-sub {
        font-size: 12px;
        color: var(--text-3);
    }
}

.rank-list {
    min-height: 80px;
}

.rank-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 9px 8px;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background: var(--brand-50);

        .rank-title {
            color: var(--brand-700);
        }
    }

    .rank-index {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-top: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background: var(--brand-50);
        color: var(--text-3);
        font-size: 12px;
        font-weight: 600;

        &.top {
            background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
            color: var(--on-brand);
        }
    }

    .rank-main {
        min-width: 0;
        flex: 1;
    }

    .rank-title {
        font-size: 13px;
        line-height: 1.5;
        color: var(--text-1);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        transition: color 0.2s ease;
    }

    .rank-meta {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-top: 4px;
        font-size: 12px;
        color: var(--text-3);
    }
}

.rank-empty {
    padding: 24px 0;
    text-align: center;
    font-size: 13px;
    color: var(--text-3);
}

/* ---------- 右侧全部文章 ---------- */
.kb-main {
    min-width: 0;
}

.main-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;

    .main-title-wrap {
        display: flex;
        align-items: baseline;
        gap: 8px;
    }

    .main-title {
        font-size: 17px;
        font-weight: 600;
        color: var(--text-1);
    }

    .main-count {
        font-size: 12px;
        color: var(--text-3);
    }
}

.sort-tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    border-radius: 9px;
    background: var(--bg-card);
    box-shadow: 0 1px 6px rgba(60, 40, 100, 0.05);

    .sort-tab {
        padding: 6px 14px;
        border: none;
        border-radius: 7px;
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        color: var(--text-2);
        transition: all 0.2s ease;

        &:hover {
            color: var(--brand-700);
        }

        &.on {
            background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
            color: var(--on-brand);
            font-weight: 500;
        }
    }
}

.kb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
    min-height: 120px;
}

.kb-card {
    display: flex;
    flex-direction: column;
    background: var(--bg-card);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(60, 40, 100, 0.05);
    transition: transform 0.22s ease, box-shadow 0.22s ease;

    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 22px rgba(60, 40, 100, 0.1);

        .kb-title {
            color: var(--brand-700);
        }

        .kb-cover img {
            transform: scale(1.04);
        }
    }
}

.kb-cover {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: var(--brand-50);
    overflow: hidden;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform 0.35s ease;
    }

    .cover-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--brand-300);
        font-size: 30px;
        background: linear-gradient(135deg, var(--brand-50), var(--brand-100));
    }

    .fav-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.88);
        color: #9aa0aa;
        font-size: 16px;
        cursor: pointer;
        opacity: 0.85;
        transition: all var(--dur-fast) ease;

        &:hover {
            background: #fff;
            transform: scale(1.06);
        }

        &.on {
            color: #f0a020;
        }
    }
}

.history-card {
    margin-top: 16px;
}

.clear-btn {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-3);

    &:hover {
        color: var(--brand-500);
    }
}

.kb-info {
    display: flex;
    flex-direction: column;
    padding: 13px 15px 15px;
    flex: 1;
}

.kb-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease;
}

.kb-summary {
    margin-top: 7px;
    font-size: 12px;
    line-height: 1.65;
    color: var(--text-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.kb-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 12px;
    font-size: 12px;
    color: var(--text-3);

    .meta-category {
        padding: 2px 8px;
        border-radius: 6px;
        background: var(--brand-100);
        color: var(--brand-500);
        white-space: nowrap;
    }

    .meta-right {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-left: auto;
        white-space: nowrap;
    }

    .meta-sep {
        margin: 0 2px;
    }
}

.kb-pagination {
    margin-top: 24px;
    justify-content: center;
}

/* ---------- 窄屏 ---------- */
@media (max-width: 1080px) {
    .kb-body {
        grid-template-columns: 1fr;
    }

    .kb-side {
        position: static;
    }

    .rank-list {
        max-height: 260px;
        overflow-y: auto;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }
}

@media (max-width: 900px) {
    .kb-page {
        padding: 16px;
    }

    .kb-banner {
        margin: -16px -16px 18px;
        padding: 20px 16px;
    }

    .banner-inner {
        padding: 0;
    }

    .main-head {
        flex-wrap: wrap;
        gap: 10px;
    }
}
</style>
