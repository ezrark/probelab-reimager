const assert = require('assert');
const {describe, it} = require('mocha');

const io = require('../../io.js');

describe('#readJeolEntry', () => {
	it('should read a .txt file', () => {
		assert.deepStrictEqual(
			io.readJeolEntry('test/data/jeol-images/1.txt'),
			{
				'sem_data_version': '1',
				'cm_signal_name': 'compo',
				'cm_detector_name': 'compo',
				'sm_add_image': [],
				'sm_add_checked_ch': '1',
				'add_ch1_signal': 'sei',
				'add_ch2_signal': 'sei',
				'add_ch3_signal': 'sei',
				'add_ch4_signal': 'sei',
				'add_ch1_detector': 'sei',
				'add_ch2_detector': 'sei',
				'add_ch3_detector': 'sei',
				'add_ch4_detector': 'sei',
				'cm_contrast': '3439',
				'cm_brightness': '102',
				'sm_mix_image': [],
				'cm_accel_volt': '15.00',
				'sm_arrival_emi': '0.00',
				'sm_gb_gun_volt': '15.00',
				'sm_gb_bias_volt': '0.00',
				'sm_wd': '10.74',
				'cm_mag': '430',
				'sm_column_mode': 'nor',
				'sm_ol_aperture': '2',
				'sm_cl_coarse': '50',
				'sm_cl_fine': '140',
				'sm_gun_ali_tilt': [
					'9',
					'-19'
				],
				'sm_cl_stig': [
					'0',
					'0'
				],
				'sm_ol_stig': [
					'-132',
					'9'
				],
				'sm_ol_stig_center': [
					'0',
					'0',
					'0',
					'0'
				],
				'sm_olap_ali': [
					'0',
					'0'
				],
				'sm_probe_no': '51',
				'sm_probe_fine': '371',
				'sm_acl_ali': [
					'0',
					'0'
				],
				'sm_column_center': [
					'0',
					'0'
				],
				'sm_ef_ali': [
					'0',
					'0'
				],
				'sm_scan_rotation': '0.00',
				'sm_wd_correct': '0',
				'sm_acl_correct': '0',
				'sm_integ_no': '1',
				'cm_scan_mode': '4',
				'cm_scan_speed': '9',
				'cm_instrument_scan_speed': '9',
				'sm_image_integration_type': '0',
				'cm_process_time': '128.00',
				'sm_photo_sn_number': '1',
				'sm_r_filter_mode': '0',
				'sm_sei_collector': '0',
				'sm_r_filter_index': '0',
				'sm_det_se1_mode_number': '0',
				'sm_det_ttl_mode_number': '0',
				'sm_det_se2_mode_number': '0',
				'sm_ne_mode_number': '0',
				'sm_ttl_collector_voltage': '0.00',
				'sm_sed_filter_mode': '0',
				'sm_ued_filter_mode': '0',
				'sm_ued_filter_value': '0.00',
				'sm_acb_mode': '1',
				'sm_acb_contrast': '5.00',
				'sm_acb_brightness': '-3.00',
				'cm_signal': 'compo',
				'cm_detector': 'compo',
				'cm_stage_pos': [
					'18.6234',
					'-19.6264',
					'12.7350',
					'0',
					'0',
					'0'
				],
				'sm_emi_current': '61.40',
				'sm_probe_current': '3.63e-009',
				'sm_penning_vac': '35.000',
				'sm_pressure_at_low_vacuum': '0.000',
				'sm_vacuum_mode_for_specimen_chamber': '0',
				'cm_format': 'jeol-sem',
				'cm_version': '3',
				'cm_comment': [],
				'cm_date': '2019/09/30',
				'cm_time': '09:59:24',
				'cm_operator': 'umnuser',
				'cm_instrument': '8530f',
				'sm_micron_bar': '91',
				'sm_micron_marker': '10um',
				'cm_frame_size': [
					'0',
					'0'
				],
				'cm_title': '20190930_001',
				'cm_label': 'umn',
				'cm_offset': [
					'0',
					'0'
				],
				'cm_full_size': [
					'2560',
					'1920'
				],
				'an_cursor_meas_type': '0',
				'an_export_mode': '1',
				'cm_color_mode': '0',
				'an_annotation_mode': '0',
				'an_cursor_meas': [],
				'an_line%0': [
					'480.00000000',
					'0.00000000',
					'480.00000000',
					'959.00000000',
					'65280',
					'1.00000000',
					'0',
					'0'
				],
				'an_line%1': [
					'800.00000000',
					'0.00000000',
					'800.00000000',
					'959.00000000',
					'65280',
					'1.00000000',
					'0',
					'0'
				],
				'an_line%2': [
					'0.00000000',
					'360.00000000',
					'1279.00000000',
					'360.00000000',
					'65280',
					'1.00000000',
					'0',
					'0'
				],
				'an_line%3': [
					'0.00000000',
					'600.00000000',
					'1279.00000000',
					'600.00000000',
					'65280',
					'1.00000000',
					'0',
					'0'
				],
				'an_text%0': [
					'5.00000000',
					'874.00000000',
					'215.00000000',
					'910.00000000',
					'"x:0.827µm"',
					'"courier',
					'new"',
					'0',
					'32.00000000',
					'16777215',
					'65793',
					'1',
					'0'
				],
				'an_text%1': [
					'220.00000000',
					'874.00000000',
					'430.00000000',
					'910.00000000',
					'"y:13.235µm"',
					'"courier',
					'new"',
					'0',
					'32.00000000',
					'16777215',
					'65793',
					'1',
					'0'
				],
				'an_text%2': [
					'435.00000000',
					'874.00000000',
					'645.00000000',
					'910.00000000',
					'"d:13.261µm"',
					'"courier',
					'new"',
					'0',
					'32.00000000',
					'16777215',
					'65793',
					'1',
					'0'
				]
			}
		);
	});

	it('should read a .txt file with a .jpg', () => {
		assert.doesNotThrow(io.readJeolEntry.bind(undefined, 'test/data/jeol-images/5.txt'));
	});

	it('should read a .txt file with a .bmp', () => {
		assert.doesNotThrow(io.readJeolEntry.bind(undefined, 'test/data/jeol-images/4.txt'));
	});

	it('should throw when .txt file is not found', () => {
		assert.throws(io.readJeolEntry.bind(undefined, 'test/data/jeol-images/4'));
	});
});

describe('#checkJeolExists', () => {
	it('should throw when file is not found', () => {
		assert.throws(io.checkJeolExists.bind(undefined, 'test/data/jeol-images/1'));
	});

	it('should find a .tif file', () => {
		assert.doesNotThrow(io.checkJeolExists.bind(undefined, 'test/data/jeol-images/1.tif'));
	});

	it('should find a .jpg file', () => {
		assert.doesNotThrow(io.checkJeolExists.bind(undefined, 'test/data/jeol-images/5.jpg'));
	});

	it('should find a .bmp file', () => {
		assert.doesNotThrow(io.checkJeolExists.bind(undefined, 'test/data/jeol-images/4.bmp'));
	});
});