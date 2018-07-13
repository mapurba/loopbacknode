module.exports = getDB();

function getDB() {
	var db = {
		"mongodb": {
			"host": "localhost",
			"port": 27017,
			"url": "",
			"database": "foodpep",
			"password": "",
			"name": "mongodb",
			"user": "",
			"connector": "mongodb"
		  }
	};

	console.log('using mysql');
	return db;
};
