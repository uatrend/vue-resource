export default (app) => {

    describe('app.url', function () {

        it('data{/id}', function () {

            expect(app.url('data{/id}')).toBe('data');
            expect(app.url('data{/id}', {id: 1})).toBe('data/1');

        });

        it('data{/array}', function () {

            expect(app.url('data{?array}')).toBe('data');
            expect(app.url('data{?array}', {array: [1, 2, 3]})).toBe('data?array=1,2,3');

        });

        it('{+path}data', function () {

            expect(app.url('{+path}data')).toBe('data');
            expect(app.url('{+path}data', {path: 'path1/path2/'})).toBe('path1/path2/data');

        });

        it('{+base}data', function () {

            app.url.options.params.base = 'base/path/';
            expect(app.url('{+base}data')).toBe('base/path/data');

        });

    });

};
