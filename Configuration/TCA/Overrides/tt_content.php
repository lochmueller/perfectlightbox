<?php

$tempColumns = [
    "tx_perfectlightbox_activate"     => [
        "exclude" => 1,
        "label"   => "LLL:EXT:perfectlightbox/locallang_db.xml:tt_content.tx_perfectlightbox_activate",
        "config"  => [
            "type" => "check",
        ]
    ],
    "tx_perfectlightbox_imageset"     => [
        "exclude" => 1,
        "label"   => "LLL:EXT:perfectlightbox/locallang_db.xml:tt_content.tx_perfectlightbox_imageset",
        "config"  => [
            "type" => "check",
        ]
    ],
    "tx_perfectlightbox_presentation" => [
        "exclude" => 1,
        "label"   => "LLL:EXT:perfectlightbox/locallang_db.xml:tt_content.tx_perfectlightbox_presentation",
        "config"  => [
            "type" => "check",
        ]
    ],
    "tx_perfectlightbox_slideshow"    => [
        "exclude" => 1,
        "label"   => "LLL:EXT:perfectlightbox/locallang_db.xml:tt_content.tx_perfectlightbox_slideshow",
        "config"  => [
            "type" => "check",
        ]
    ],
];

\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addTCAcolumns("tt_content", $tempColumns);

$fields = ',tx_perfectlightbox_activate,tx_perfectlightbox_imageset,tx_perfectlightbox_presentation,tx_perfectlightbox_slideshow';

$GLOBALS['TCA']['tt_content']['palettes']['7']['showitem'] .= $fields;
# BEN: Quickfix for TYPO3 4.5
$GLOBALS['TCA']['tt_content']['palettes']['imagelinks']['showitem'] .= $fields;
