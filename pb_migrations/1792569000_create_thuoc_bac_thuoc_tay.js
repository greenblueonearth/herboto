/// <reference path="../pb_data/types.d.ts" />
const libraryNames = ['thuoc_bac', 'thuoc_tay'];

function createLibraryCollection(name) {
	return new Collection({
		name,
		type: 'base',
		listRule: '',
		viewRule: '',
		createRule: '',
		updateRule: '',
		deleteRule: '',
		fields: [
			new TextField({ name: 'name', required: true, max: 120 }),
			new TextField({ name: 'scientific_name', max: 160 }),
			new TextField({ name: 'category', required: true, max: 80 }),
			new TextField({ name: 'parts_used', max: 200 }),
			new TextField({ name: 'benefits', required: true, max: 2000 }),
			new TextField({ name: 'usage', max: 2000 }),
			new TextField({ name: 'precautions', max: 2000 }),
			new TextField({ name: 'author', max: 100 })
		]
	});
}

migrate((app) => {
	for (const name of libraryNames) {
		const error = app.save(createLibraryCollection(name));
		if (error) return error;
	}

	return null;
}, (app) => {
	for (const name of libraryNames) {
		const collection = app.findCollectionByNameOrId(name);
		const error = app.delete(collection);
		if (error) return error;
	}

	return null;
});