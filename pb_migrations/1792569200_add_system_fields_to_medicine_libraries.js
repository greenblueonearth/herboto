/// <reference path="../pb_data/types.d.ts" />
const libraryNames = ['thuoc_bac', 'thuoc_tay'];

migrate((app) => {
	for (const name of libraryNames) {
		const collection = app.findCollectionByNameOrId(name);
		const fieldNames = collection.fields.fieldNames();

		if (!fieldNames.includes('id')) {
			collection.fields.push(
				new TextField({
					name: 'id',
					required: true,
					min: 15,
					max: 15,
					pattern: '^[a-z0-9]+$',
					autogeneratePattern: '[a-z0-9]{15}',
					primaryKey: true,
					system: true
				})
			);
		}
		if (!fieldNames.includes('created')) {
			collection.fields.push(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }));
		}
		if (!fieldNames.includes('updated')) {
			collection.fields.push(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }));
		}

		const error = app.save(collection);
		if (error) return error;
	}

	return null;
}, (app) => {
	for (const name of libraryNames) {
		const collection = app.findCollectionByNameOrId(name);
		for (const fieldName of ['id', 'created', 'updated']) {
			collection.fields.removeByName(fieldName);
		}
		const error = app.save(collection);
		if (error) return error;
	}

	return null;
});