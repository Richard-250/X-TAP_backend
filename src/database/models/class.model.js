module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('Class', {
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
    level: DataTypes.STRING,
    section: DataTypes.STRING,
    description: DataTypes.TEXT,
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'computer'
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'blue'
    },
    bgColor: DataTypes.STRING
  }, {
    tableName: 'classes',
    timestamps: true,
    indexes: [
      { fields: ['level'] },
      { fields: ['section'] },
      { fields: ['level', 'section'] },
      { fields: ['color'] },
      { fields: ['icon'] }
    ]
  });

  Class.associate = (models) => {
    Class.hasMany(models.Student, { foreignKey: 'classId' });
    Class.hasMany(models.Attendance, { foreignKey: 'classId' });
  };

  return Class;
};