import {createTestApp} from "./util";

export default (app) => {

    describe('app.http', function () {

        it('get("data/text.txt")', done => {
            app.http.get('data/text.txt').then(res => {

                expect(res.ok).toBe(true);
                expect(res.status).toBe(200);
                expect(res.body).toBe('text');
                expect(res.data).toBe(res.body);
                expect(res.headers.get('Content-Type')).toBe('text/plain');

                done();
            });

        });

        it('get("data/valid.json")', done => {

            app.http.get('data/valid.json').then(res => {

                expect(res.ok).toBe(true);
                expect(res.status).toBe(200);
                expect(typeof res.body).toBe('object');
                expect(res.body.foo).toBe('bar');

                done();
            });

        });

        it('get("data/invalid.json")', done => {

            app.http.get('data/invalid.json').then(res => {

                expect(res.ok).toBe(true);
                expect(res.status).toBe(200);
                expect(res.body).toBeNull();

                done();
            });

        });

        it('get("github.com/avatar")', done => {

            app.http.get('https://avatars1.githubusercontent.com/u/6128107', {responseType: 'blob'}).then(res => {

                expect(res.ok).toBe(true);
                expect(res.status).toBe(200);
                expect(res.body instanceof Blob).toBe(true);
                expect(res.body.type).toBe('image/png');

                done();
            });

        });

        //  cors issue
        // it('get("cors-api.appspot.com")', done => {

        //     app.http.get('http://server.cors-api.appspot.com/server?id=1&enable=true').then(res => {

        //         expect(res.ok).toBe(true);
        //         expect(res.status).toBe(200);
        //         expect(typeof res.body).toBe('object');
        //         expect(res.body.shift().requestType).toBe('cors');

        //         if (res.headers.get('Content-Type')) {
        //             expect(res.headers.get('Content-Type')).toBe('application/json');
        //         }

        //         done();
        //     });

        // });

        // blocked resource
        // it('jsonp("jsfiddle.net/jsonp")', done => {

        //     app.http.jsonp('http://jsfiddle.net/echo/jsonp/', {params: {foo: 'bar'}}).then(res => {

        //         expect(res.ok).toBe(true);
        //         expect(res.status).toBe(200);
        //         expect(typeof res.body).toBe('object');
        //         expect(res.body.foo).toBe('bar');

        //         done();
        //     });

        // });

    });

    describe('this.$http', function () {

        it('get("data/valid.json")', done => {

            var vm = createTestApp({

                created() {
                    this.$http.get('data/valid.json').then((res) => {

                        expect(this).toEqual(vm);
                        expect(res.ok).toBe(true);
                        expect(res.status).toBe(200);
                        expect(typeof res.body).toBe('object');
                        expect(res.body.foo).toBe('bar');

                        done();

                    });
                }
            });

        });

        it('get("data/valid.json") with timeout', done => {

            var vm = createTestApp({

                created() {

                    var random = Math.random().toString(36).substr(2);

                    this.$http.get(`data/valid.json?${random}`, {timeout: 1}).then(res => {

                        fail('Callback has been called');

                    }, res => {

                        expect(res.ok).toBe(false);
                        expect(res.status).toBe(0);

                        done();

                    });

                }

            });

        });

        it('get("data/valid.json") with abort()', done => {

            var vm = createTestApp({

                created() {

                    var random = Math.random().toString(36).substr(2);

                    this.$http.get(`data/valid.json?${random}`, {

                        before(req) {
                            setTimeout(() => {

                                expect(typeof req.abort).toBe('function');

                                req.abort();

                            }, 0);
                        }

                    }).then(res => {
                        fail('Callback has been called');
                    }, res => {
                        done();
                    });
                }

            });

        });

        it('get("data/notfound.json") using catch()', done => {

            var vm = createTestApp({

                created() {

                    this.$http.get('data/notfound.json').catch(res => {

                        expect(this).toEqual(vm);
                        expect(res.ok).toBe(false);
                        expect(res.status).toBe(404);

                        done();
                    });

                }

            });

        });

    });

};