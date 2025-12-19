const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_KEY || 'masterKey123456'
});

const PORTFOLIO_INDEX = 'portfolios';

async function initMeilisearch() {
  try {
    // Create portfolio index
    const index = await client.createIndex(PORTFOLIO_INDEX, { primaryKey: 'id' });
    console.log(`✅ Created index: ${PORTFOLIO_INDEX}`);
  } catch (error) {
    if (error.code === 'index_already_exists') {
      console.log(`✅ Index ${PORTFOLIO_INDEX} already exists`);
    } else {
      throw error;
    }
  }

  // Configure index settings
  const index = client.index(PORTFOLIO_INDEX);

  // Set searchable attributes
  await index.updateSearchableAttributes([
    'title',
    'description',
    'tags',
    'technologies',
    'category'
  ]);

  // Set filterable attributes
  await index.updateFilterableAttributes([
    'userId',
    'tags',
    'category',
    'status',
    'isPublic',
    'featured'
  ]);

  // Set sortable attributes
  await index.updateSortableAttributes([
    'createdAt',
    'views',
    'likes',
    'title'
  ]);

  // Set ranking rules
  await index.updateRankingRules([
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness'
  ]);

  console.log('✅ Meilisearch index configured successfully');
}

async function searchPortfolios(query, options = {}) {
  try {
    const index = client.index(PORTFOLIO_INDEX);
    
    const searchOptions = {
      limit: options.limit || 20,
      offset: options.offset || 0,
      attributesToHighlight: ['title', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      ...options
    };

    // Only search public and published portfolios
    const baseFilter = 'status = "published" AND isPublic = true';
    
    if (searchOptions.filter && searchOptions.filter.length > 0) {
      searchOptions.filter = [baseFilter, ...searchOptions.filter];
    } else {
      searchOptions.filter = [baseFilter];
    }

    const results = await index.search(query, searchOptions);

    return {
      hits: results.hits,
      totalHits: results.estimatedTotalHits,
      processingTimeMs: results.processingTimeMs,
      query: results.query,
      limit: results.limit,
      offset: results.offset
    };
  } catch (error) {
    console.error('Meilisearch search error:', error);
    throw new Error('Search service unavailable');
  }
}

async function indexPortfolio(portfolio) {
  try {
    const index = client.index(PORTFOLIO_INDEX);
    
    // Prepare document for indexing
    const document = {
      id: portfolio.id,
      userId: portfolio.userId,
      title: portfolio.title,
      description: portfolio.description,
      tags: portfolio.tags || [],
      category: portfolio.category,
      status: portfolio.status,
      isPublic: portfolio.isPublic,
      thumbnail: portfolio.thumbnail || '',
      technologies: portfolio.technologies || [],
      views: portfolio.views || 0,
      likes: portfolio.likes || 0,
      featured: portfolio.featured || false,
      createdAt: new Date(portfolio.createdAt).getTime(),
      updatedAt: new Date(portfolio.updatedAt).getTime()
    };

    await index.addDocuments([document]);
    console.log(`✅ Indexed portfolio: ${portfolio.id}`);
  } catch (error) {
    console.error('Meilisearch index error:', error);
    throw error;
  }
}

async function deletePortfolio(portfolioId) {
  try {
    const index = client.index(PORTFOLIO_INDEX);
    await index.deleteDocument(portfolioId);
    console.log(`✅ Deleted portfolio from index: ${portfolioId}`);
  } catch (error) {
    console.error('Meilisearch delete error:', error);
    throw error;
  }
}

async function getSuggestions(query, limit = 5) {
  try {
    const index = client.index(PORTFOLIO_INDEX);
    
    const results = await index.search(query, {
      limit,
      attributesToRetrieve: ['title', 'tags'],
      filter: ['status = "published"', 'isPublic = true']
    });

    // Extract unique suggestions from titles and tags
    const suggestions = new Set();
    
    results.hits.forEach(hit => {
      // Add title words
      if (hit.title) {
        const titleWords = hit.title.toLowerCase().split(/\s+/);
        titleWords.forEach(word => {
          if (word.includes(query.toLowerCase()) && word.length > 2) {
            suggestions.add(word);
          }
        });
      }

      // Add matching tags
      if (hit.tags) {
        hit.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(tag);
          }
        });
      }
    });

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Meilisearch suggestions error:', error);
    return [];
  }
}

module.exports = {
  client,
  initMeilisearch,
  searchPortfolios,
  indexPortfolio,
  deletePortfolio,
  getSuggestions
};
