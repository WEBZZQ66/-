<template>
    <div class="article-page">
        <div class="article-wrap">
            <button type="button" class="back-btn" @click="goBack">
                <el-icon><ArrowLeft /></el-icon>
                返回知识库
            </button>

            <!-- 未登录 -->
            <div v-if="!loggedIn" class="state">
                <el-icon class="state-icon"><Lock /></el-icon>
                <p>登录后即可阅读知识文章</p>
                <el-button class="state-btn" @click="goLogin">去登录</el-button>
            </div>

            <el-skeleton v-else-if="loading" class="skeleton" :rows="8" animated />

            <article v-else-if="article" class="article">
                <header class="article-head">
                    <span v-if="article.category" class="article-category">{{ article.category }}</span>
                    <h1 class="article-title">{{ article.title }}</h1>

                    <div class="article-meta">
                        <span v-if="article.author">{{ article.author }}</span>
                        <span><el-icon><View /></el-icon>{{ article.readCount }}</span>
                        <span>{{ article.timeText }}</span>
                    </div>

                    <button
                        type="button"
                        class="fav-btn"
                        :class="{ on: article.isFavorited }"
                        @click="handleFavorite"
                    >
                        <el-icon>
                            <StarFilled v-if="article.isFavorited" />
                            <Star v-else />
                        </el-icon>
                        {{ article.isFavorited ? '已收藏' : '收藏' }}
                        <span v-if="article.favoriteCount" class="fav-count">{{ article.favoriteCount }}</span>
                    </button>

                    <div v-if="article.tags.length" class="article-tags">
                        <span v-for="tag in article.tags" :key="tag" class="article-tag">{{ tag }}</span>
                    </div>
                </header>

                <img v-if="article.cover" class="article-cover" :src="article.cover" :alt="article.title" />

                <!-- 后台富文本编辑器存的 HTML，这里直接渲染 -->
                <div v-if="article.content" class="article-content" v-html="article.content"></div>
                <el-empty v-else description="暂无正文内容" :image-size="80" />
            </article>

            <div v-else class="state">
                <el-icon class="state-icon"><Warning /></el-icon>
                <p>{{ errorText || '文章不存在或已下线' }}</p>
                <el-button class="state-btn" @click="goBack">返回知识库</el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { knowledgeArticleDetail } from '@/api/user'
import { normalizeArticle } from '@/utils/article'
import { addHistory } from '@/utils/readingHistory'
import { isFavorited, toggleFavorite } from '@/utils/favorites'

const route = useRoute()
const router = useRouter()

const loggedIn = ref(Boolean(localStorage.getItem('token')))
const article = ref(null)
const loading = ref(false)
const errorText = ref('')

const goBack = () => router.push('/knowledge')

//收藏 / 取消收藏：后端暂无收藏接口，先记在本地
const handleFavorite = () => {
    if (!article.value) return
    article.value.isFavorited = toggleFavorite(article.value)
    ElMessage.success(article.value.isFavorited ? '已加入收藏' : '已取消收藏')
}
const goLogin = () => router.push({ path: '/auth/login', query: { redirect: route.fullPath } })

const fetchDetail = async (id) => {
    if (!id || !loggedIn.value) return
    loading.value = true
    errorText.value = ''
    article.value = null
    try {
        const data = await knowledgeArticleDetail(id)
        const normalized = normalizeArticle(data)
        if (!normalized.title) {
            errorText.value = '没有取到文章内容'
            return
        }
        normalized.isFavorited = isFavorited(normalized.id) || normalized.isFavorited
        article.value = normalized
        //顺手记一次最近阅读（纯本地）
        addHistory(normalized)
    } catch (error) {
        errorText.value = `文章加载失败：${error?.message || '请稍后重试'}`
    } finally {
        loading.value = false
    }
}

//切到另一篇文章时重新拉取
watch(() => route.params.id, id => fetchDetail(id))

onMounted(() => {
    fetchDetail(route.params.id)
})
</script>

<style lang="scss" scoped>
.article-page {
    flex: 1;
    padding: 24px;
    background: var(--bg-page);
    box-sizing: border-box;
}

.article-wrap {
    max-width: 860px;
    margin: 0 auto;
}

.back-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 16px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-2);
    transition: color 0.2s ease;

    &:hover {
        color: var(--brand-700);
    }
}

.article {
    padding: 32px 36px 36px;
    background: var(--bg-card);
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(60, 40, 100, 0.05);
}

.article-head {
    padding-bottom: 18px;
    border-bottom: 1px solid var(--border);

    .article-category {
        display: inline-block;
        margin-bottom: 10px;
        padding: 2px 8px;
        border-radius: 6px;
        background: var(--brand-100);
        color: var(--brand-500);
        font-size: 12px;
    }

    .article-title {
        font-size: 26px;
        font-weight: 600;
        line-height: 1.5;
        color: var(--text-1);
    }

    .article-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 16px;
        margin-top: 12px;
        font-size: 13px;
        color: var(--text-3);

        span {
            display: inline-flex;
            align-items: center;
            gap: 3px;
        }
    }

    .fav-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-top: 14px;
        padding: 6px 14px;
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-2);
        font-size: 13px;
        cursor: pointer;
        transition: all var(--dur-fast) ease;

        &:hover {
            border-color: var(--brand-300);
            color: var(--brand-500);
        }

        &.on {
            border-color: #f3d7a0;
            background: #fdf6e7;
            color: #d48806;
        }

        .fav-count {
            font-size: 12px;
            opacity: 0.8;
        }
    }

    .article-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 12px;

        .article-tag {
            padding: 2px 8px;
            border-radius: 6px;
            background: var(--brand-50);
            color: var(--brand-500);
            font-size: 12px;
        }
    }
}

.article-cover {
    width: 100%;
    /* 竖版封面按原比例会撑得很高，这里裁成横幅 */
    max-height: 340px;
    margin-top: 20px;
    border-radius: 10px;
    object-fit: cover;
}

.article-content {
    margin-top: 20px;
    font-size: 15px;
    line-height: 1.95;
    color: #374151;
    word-break: break-word;

    :deep(img) {
        max-width: 100%;
        border-radius: 8px;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3) {
        margin: 20px 0 10px;
        color: var(--text-1);
    }

    :deep(p) {
        margin: 12px 0;
    }

    :deep(ul),
    :deep(ol) {
        padding-left: 22px;
        margin: 12px 0;
    }

    :deep(blockquote) {
        margin: 14px 0;
        padding: 10px 14px;
        border-left: 3px solid var(--brand-300);
        background: var(--brand-50);
        color: var(--text-2);
    }
}

.skeleton {
    padding: 32px 36px;
    background: var(--bg-card);
    border-radius: 16px;
}

.state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 80px 0;
    background: var(--bg-card);
    border-radius: 16px;
    font-size: 14px;
    color: var(--text-2);

    .state-icon {
        font-size: 34px;
        color: var(--brand-300);
    }

    .state-btn {
        margin-top: 6px;
        height: 36px;
        padding: 0 22px;
        border-radius: 8px;
        border: none;
        background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
        color: var(--on-brand);

        &:hover {
            background: linear-gradient(135deg, #8b5cc4, #5f2b9c);
            color: #fff;
        }
    }
}

@media (max-width: 900px) {
    .article-page {
        padding: 16px;
    }

    .article {
        padding: 22px 18px 26px;
    }

    .article-head .article-title {
        font-size: 21px;
    }
}
</style>
