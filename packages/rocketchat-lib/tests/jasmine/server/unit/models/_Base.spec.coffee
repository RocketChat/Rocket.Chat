describe 'rocketchat:lib Server | Models | Base', ->

	beforeEach ->
		MeteorStubs.install()
		this.obj = new RocketChat.models._Base

	afterEach ->
		MeteorStubs.uninstall()

	it 'should exist', ->
		expect(this.obj).toBeDefined()

	it 'should provide a basename for collections', ->
		expect(typeof this.obj._baseName()).toBe('string')

	it 'should carry a Mongo.Collection object when initialized', ->
		expect(this.obj.model).toBeFalsy()
		expect(this.obj._initModel('carry')).toBeTruthy()
		expect(typeof this.obj.model).toBe('object')

	it 'should apply a basename to the Mongo.Collection created', ->
		name = 'apply'
		expect(this.obj._initModel(name)).toBeTruthy()
		expect(this.obj.model._name).toBe(this.obj._baseName() + name)
