<?php
if (!defined ('TYPO3_MODE')) 	die ('Access denied.');
$tempColumns = Array (
	"tx_perfectlightbox_activate" => Array (		
		"exclude" => 1,		
		"label" => "LLL:EXT:perfectlightbox/locallang_db.xml:tt_content.tx_perfectlightbox_activate",		
		"config" => Array (
			"type" => "check",
		)
	),
	"tx_perfectlightbox_imageset" => Array (		
		"exclude" => 1,		
		"label" => "LLL:EXT:perfectlightbox/locallang_db.xml:tt_content.tx_perfectlightbox_imageset",		
		"config" => Array (
			"type" => "check",
		)
	),
	"tx_perfectlightbox_presentation" => Array (		
		"exclude" => 1,		
		"label" => "LLL:EXT:perfectlightbox/locallang_db.xml:tt_content.tx_perfectlightbox_presentation",		
		"config" => Array (
			"type" => "check",
		)
	),
	"tx_perfectlightbox_slideshow" => Array (		
		"exclude" => 1,		
		"label" => "LLL:EXT:perfectlightbox/locallang_db.xml:tt_content.tx_perfectlightbox_slideshow",		
		"config" => Array (
			"type" => "check",
		)
	),
);

if (version_compare(TYPO3_branch, '6.1', '<')) {
	t3lib_div::loadTCA("tt_content");
}
t3lib_extMgm::addTCAcolumns("tt_content",$tempColumns,1);
t3lib_extMgm::addStaticFile($_EXTKEY,'static/', 'Perfect Lightbox');

$GLOBALS['TCA']['tt_content']['palettes']['7']['showitem'] .= ', tx_perfectlightbox_activate, tx_perfectlightbox_imageset, tx_perfectlightbox_presentation, tx_perfectlightbox_slideshow';
# BEN: Quickfix for TYPO3 4.5
$GLOBALS['TCA']['tt_content']['palettes']['imagelinks']['showitem'] .= ', tx_perfectlightbox_activate, tx_perfectlightbox_imageset, tx_perfectlightbox_presentation, tx_perfectlightbox_slideshow';
?>