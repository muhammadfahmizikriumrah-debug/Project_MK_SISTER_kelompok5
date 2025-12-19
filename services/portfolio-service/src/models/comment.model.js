const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const PortfolioComment = sequelize.define('PortfolioComment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    portfolioId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'deleted'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'portfolio_comments',
    timestamps: true,
    indexes: [
      { fields: ['portfolioId'] },
      { fields: ['userId'] },
      { fields: ['parentId'] },
      { fields: ['status'] }
    ]
  })

  return PortfolioComment
}
