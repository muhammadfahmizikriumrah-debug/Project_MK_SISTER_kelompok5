const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Job title or academic position'
    },
    institution: {
      type: DataTypes.STRING,
      allowNull: true
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    socialLinks: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Social media links: github, linkedin, twitter, etc.'
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    education: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of education history'
    },
    experience: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of work experience'
    },
    publications: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of publications/research'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Profile visibility'
    },
    profileViews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'profiles',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      }
    ]
  });

  return Profile;
};
