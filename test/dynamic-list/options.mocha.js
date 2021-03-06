describe('zb.ui.data.DynamicList options', () => {
	const expect = chai.expect;
	const DynamicList = zb.ui.data.DynamicList;

	describe('Should not throw error', () => {
		it('With default options', () => {
			expect(() => {
				new DynamicList(() => {});
			}).not.to.throw();
		});

		it('With custom options', () => {
			expect(() => {
				new DynamicList(() => {}, {
					startFrom: 0,
					startLoadingOnItemsLeft: 5,
					frameSize: 15,
					initialBufferSize: 35,
					bufferSize: 35
				});
			}).not.to.throw();
		});
	});

	describe('Should throw error', () => {
		it('With NaN option', () => {
			expect(() => {
				new DynamicList(() => {}, {
					startFrom: 0,
					startLoadingOnItemsLeft: NaN,
					frameSize: 15,
					initialBufferSize: 35,
					bufferSize: 35
				});
			}).to.throw();
		});

		it('With zero option', () => {
			expect(() => {
				new DynamicList(() => {}, {
					startFrom: 0,
					startLoadingOnItemsLeft: 5,
					frameSize: 0,
					initialBufferSize: 35,
					bufferSize: 35
				});
			}).to.throw();
		});

		it('With negative option', () => {
			expect(() => {
				new DynamicList(() => {}, {
					startFrom: 0,
					startLoadingOnItemsLeft: 5,
					frameSize: 15,
					initialBufferSize: -35,
					bufferSize: 35
				});
			}).to.throw();
		});

		it('With wrong frameSize', () => {
			expect(() => {
				new DynamicList(() => {}, {
					startFrom: 0,
					startLoadingOnItemsLeft: 18,
					frameSize: 12,
					initialBufferSize: 50,
					bufferSize: 50
				});
			}).to.throw();
		});

		it('With options combination which causes recursion', () => {
			expect(() => {
				new DynamicList(() => {}, {
					startFrom: 0,
					startLoadingOnItemsLeft: 10,
					frameSize: 10,
					initialBufferSize: 10,
					bufferSize: 20
				});
			}).to.throw();
		});
	});
});
