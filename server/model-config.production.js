module.exports = {
  '_meta': {
    'sources': [
      'loopback/common/models',
      'loopback/server/models',
      'digitopia-admin/common/models',
      '../common/models',
      './models'
    ],
    'mixins': [
      'loopback/common/mixins',
      'loopback/server/mixins',
      '../node_modules/loopback-ds-timestamp-mixin',
      '../common/mixins',
      './mixins'
    ]
  },
  'Upload': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'User': {
    'dataSource': 'mongodb',
    'public': false
  },
  'AccessToken': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'ACL': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'RoleMapping': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'Role': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'MyUser': {
    'dataSource': 'mongodb',
    'public': true
  },
  'UserIdentity': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'ImageSet': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'TypeTest': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'TypeTestLookup': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'TestThrough': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'I18n': {
    'dataSource': 'mongodb',
    'public': process.env.ADMIN ? true : false
  },
  'OgTag': {
    'dataSource': 'mongodb',
    'public': true
  }
};
