const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PortfolioLike = sequelize.define('PortfolioLike', {
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
    }
  }, {
    tableName: 'portfolio_likes',
    timestamps: true,
    indexes: [
      {
        fields: ['portfolioId', 'userId'],
        unique: true
      },
      {
        fields: ['userId']
      }
    ]
  });

  return PortfolioLike;
};
