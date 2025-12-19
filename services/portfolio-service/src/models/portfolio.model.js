const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Portfolio = sequelize.define('Portfolio', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Research, Project, Publication, etc.'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    projectUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'External project link'
    },
    demoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Demo or preview link'
    },
    repositoryUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Github/Gitlab repository'
    },
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Thumbnail image URL'
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      comment: 'Array of image URLs'
    },
    technologies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    collaborators: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of collaborator info'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'portfolios',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['isPublic']
      },
      {
        fields: ['tags'],
        using: 'gin'
      }
    ]
  });

  return Portfolio;
};
