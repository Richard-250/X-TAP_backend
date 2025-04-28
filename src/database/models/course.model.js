module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: DataTypes.TEXT
  }, {
    tableName: 'courses',
    timestamps: true
  });

  Course.associate = (models) => {
    Course.hasMany(models.Student, { foreignKey: 'courseId' });
  };

  return Course;
};