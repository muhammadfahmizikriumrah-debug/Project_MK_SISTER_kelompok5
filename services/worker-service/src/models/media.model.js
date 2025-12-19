const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Media = sequelize.define('Media', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('image', 'document', 'video', 'other'),
      defaultValue: 'other'
    },
    status: {
      type: DataTypes.ENUM('uploading', 'processing', 'ready', 'failed'),
      defaultValue: 'uploading'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'media',
    timestamps: true
  });

  return Media;
};
