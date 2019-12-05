<script type="text/javascript">
	jQuery(function($) {
		$("a[rel^='lightbox']").slimbox({
            resizeDuration: ###RESIZE_DURATION###,
            counterText: "###ALBUM_LABEL_IMAGE### {x} ###ALBUM_LABEL_OF### {y}",
            loop: true
        },
        null, function(el) {
			return (this == el) || ((this.rel.length > 8) && (this.rel == el.rel));
		});
	});
</script>