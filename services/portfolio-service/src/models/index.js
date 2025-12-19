const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const Portfolio = require('./portfolio.model')(sequelize);
const PortfolioLike = require('./portfolio-like.model')(sequelize);
const PortfolioComment = require('./comment.model')(sequelize);

// Associations
Portfolio.hasMany(PortfolioComment, {
  foreignKey: 'portfolioId',
  as: 'comments',
  onDelete: 'CASCADE'
});

PortfolioComment.belongsTo(Portfolio, {
  foreignKey: 'portfolioId',
  as: 'portfolio'
});

PortfolioComment.hasMany(PortfolioComment, {
  foreignKey: 'parentId',
  as: 'replies'
});

PortfolioComment.belongsTo(PortfolioComment, {
  foreignKey: 'parentId',
  as: 'parent'
});

const db = {
  sequelize,
  Sequelize,
  Portfolio,
  PortfolioLike,
  PortfolioComment
};

module.exports = db;
