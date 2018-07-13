(function ($) {
	function logoutController(elem, options) {
		this.element = $(elem);

		this.start = function () {
			this.element.on('click', function (e) {
				e.preventDefault();
				$.post('/api/MyUsers/logout')
					.done(function () {
						loadPage('/?logout');
						didLogOut();
					})
					.fail(function () {
						alert("error");
					});
			});
		};

		this.stop = function () {
			this.element.off('click');
		};
	}
	$.fn.logoutController = GetJQueryPlugin('logoutController', logoutController);
})(jQuery);
