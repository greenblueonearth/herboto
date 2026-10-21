/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
	const collection = app.findCollectionByNameOrId('thuoc_nam');

	collection.fields.push(
		new TextField({ name: 'name', required: true, max: 120 }),
		new TextField({ name: 'scientific_name', max: 160 }),
		new TextField({ name: 'category', required: true, max: 80 }),
		new TextField({ name: 'parts_used', max: 200 }),
		new TextField({ name: 'benefits', required: true, max: 2000 }),
		new TextField({ name: 'usage', max: 2000 }),
		new TextField({ name: 'precautions', max: 2000 }),
		new TextField({ name: 'author', max: 100 })
	);

	collection.listRule = '';
	collection.viewRule = '';
	collection.createRule = '';
	collection.updateRule = '';
	collection.deleteRule = '';

	return app.save(collection);
}, (app) => {
	const collection = app.findCollectionByNameOrId('thuoc_nam');

	for (const fieldName of [
		'name',
		'scientific_name',
		'category',
		'parts_used',
		'benefits',
		'usage',
		'precautions',
		'author'
	]) {
		collection.fields.removeByName(fieldName);
	}

	collection.listRule = null;
	collection.viewRule = null;
	collection.createRule = null;
	collection.updateRule = null;
	collection.deleteRule = null;

	return app.save(collection);
});