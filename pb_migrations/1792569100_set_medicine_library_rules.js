/// <reference path="../pb_data/types.d.ts" />
const libraryNames = ['thuoc_bac', 'thuoc_tay'];

migrate((app) => {
	for (const name of libraryNames) {
		const collection = app.findCollectionByNameOrId(name);
		collection.listRule = '';
		collection.viewRule = '';
		collection.createRule = '';
		collection.updateRule = '';
		collection.deleteRule = '';
		const error = app.save(collection);
		if (error) return error;
	}

	return null;
}, (app) => {
	for (const name of libraryNames) {
		const collection = app.findCollectionByNameOrId(name);
		collection.listRule = null;
		collection.viewRule = null;
		collection.createRule = null;
		collection.updateRule = null;
		collection.deleteRule = null;
		const error = app.save(collection);
		if (error) return error;
	}

	return null;
});