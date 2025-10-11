import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:intl/intl.dart';
import 'package:pet_flutter/services/service_service.dart';
import 'package:pet_flutter/widgets/shimmer_placeholders.dart';
import 'package:pet_flutter/pages/appointment_booking_page.dart';

class EnhancedServicesPage extends StatefulWidget {
  const EnhancedServicesPage({super.key});
  
  @override
  State<EnhancedServicesPage> createState() => _EnhancedServicesPageState();
}

class _EnhancedServicesPageState extends State<EnhancedServicesPage> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _items = const [];
  List<Map<String, dynamic>> _filteredItems = const [];
  String _searchQuery = '';
  String _selectedCategory = 'all';
  String _sortBy = 'popular'; // popular, price_low, price_high, rating
  double _minPrice = 0;
  double _maxPrice = 1000000;
  String _selectedDuration = 'all';
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, String>> _categories = [
    {'id': 'all', 'name': 'Tất cả', 'icon': 'paw', 'emoji': '🐾'},
    {'id': 'grooming', 'name': 'Grooming', 'icon': 'scissors', 'emoji': '🐕'},
    {'id': 'medical', 'name': 'Y tế', 'icon': 'stethoscope', 'emoji': '💉'},
    {'id': 'hotel', 'name': 'Khách sạn', 'icon': 'hotel', 'emoji': '🏨'},
    {'id': 'food', 'name': 'Thức ăn', 'icon': 'utensils', 'emoji': '🍖'},
  ];

  final List<Map<String, dynamic>> _durationFilters = [
    {'id': 'all', 'name': 'Tất cả', 'value': null},
    {'id': '30', 'name': '30 phút', 'value': 30},
    {'id': '60', 'name': '1 giờ', 'value': 60},
    {'id': '120', 'name': '2 giờ', 'value': 120},
    {'id': '180', 'name': '3 giờ', 'value': 180},
  ];

  final List<Map<String, dynamic>> _sortOptions = [
    {'id': 'popular', 'name': 'Phổ biến', 'icon': FontAwesomeIcons.fire},
    {'id': 'rating', 'name': 'Đánh giá cao', 'icon': FontAwesomeIcons.star},
    {'id': 'price_low', 'name': 'Giá thấp', 'icon': FontAwesomeIcons.arrowDown},
    {'id': 'price_high', 'name': 'Giá cao', 'icon': FontAwesomeIcons.arrowUp},
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final svc = ServiceService();
      final data = await svc.getFilteredServices(
        category: _selectedCategory != 'all' ? _selectedCategory : null,
        minPrice: _minPrice > 0 ? _minPrice : null,
        maxPrice: _maxPrice < 1000000 ? _maxPrice : null,
        duration: _selectedDuration != 'all' ? 
          (_durationFilters.firstWhere((d) => d['id'] == _selectedDuration)['value'] as int?) : null,
        sortBy: _sortBy,
      );
      setState(() {
        _items = data;
        _filteredItems = data;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  void _applyFilters() {
    // Reload data with new filters
    _load();
  }

  void _applySorting() {
    // Sorting is now handled by the API
    _load();
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
    // For now, we'll do local search filtering
    // In the future, this could be moved to API as well
    _applyLocalSearch();
  }

  void _applyLocalSearch() {
    setState(() {
      _filteredItems = _items.where((service) {
        final matchesSearch = _searchQuery.isEmpty ||
            (service['name'] as String? ?? '').toLowerCase().contains(_searchQuery.toLowerCase()) ||
            (service['description'] as String? ?? '').toLowerCase().contains(_searchQuery.toLowerCase());
        
        return matchesSearch;
      }).toList();
    });
  }

  void _onCategoryChanged(String category) {
    setState(() {
      _selectedCategory = category;
    });
    _applyFilters();
  }

  void _onSortChanged(String sortBy) {
    setState(() {
      _sortBy = sortBy;
    });
    _applySorting();
  }


  @override
  Widget build(BuildContext context) {
    Widget body;
    
    if (_loading) {
      body = _buildShimmerBody();
    } else if (_error != null) {
      body = _buildErrorState();
    } else {
      body = _buildContent();
    }
    
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Dịch vụ'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const FaIcon(FontAwesomeIcons.arrowsRotate),
            onPressed: _load,
          ),
          IconButton(
            icon: const FaIcon(FontAwesomeIcons.sliders),
            onPressed: _showFilterDialog,
          ),
        ],
      ),
      body: body,
    );
  }

  Widget _buildShimmerBody() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Search bar shimmer
          ShimmerInputField(
            width: double.infinity,
            height: 50,
            margin: const EdgeInsets.only(bottom: 16),
          ),
          
          // Categories shimmer
          ShimmerText(width: 100, height: 20, margin: const EdgeInsets.only(bottom: 12)),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(5, (index) => Container(
                margin: EdgeInsets.only(right: index < 4 ? 8 : 0),
                child: ShimmerButton(
                  width: 80,
                  height: 40,
                ),
              )),
            ),
          ),
          const SizedBox(height: 20),
          
          // Services shimmer
          ...List.generate(3, (index) => Container(
            margin: const EdgeInsets.only(bottom: 20),
            child: ShimmerCard(
              width: double.infinity,
              height: 200,
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          FaIcon(
            FontAwesomeIcons.triangleExclamation,
            size: 64,
            color: Colors.red.shade300,
          ),
          const SizedBox(height: 16),
          Text(
            'Có lỗi xảy ra',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: Colors.red.shade600,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _error!,
            style: TextStyle(color: Colors.red.shade500),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _load,
            icon: const FaIcon(FontAwesomeIcons.arrowsRotate),
            label: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return Column(
      children: [
        // Search and filters section
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                spreadRadius: 0,
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              // Search bar
              TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Tìm kiếm dịch vụ...',
                  prefixIcon: const FaIcon(FontAwesomeIcons.magnifyingGlass, size: 16),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const FaIcon(FontAwesomeIcons.xmark, size: 16),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Theme.of(context).colorScheme.primary),
                  ),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                ),
              ),
              const SizedBox(height: 16),
              
              // Category filters
              SizedBox(
                height: 50,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final category = _categories[index];
                    final isSelected = _selectedCategory == category['id'];
                    return _buildCategoryChip(category, isSelected);
                  },
                ),
              ),
              
              // Sort and filter info
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildSortChip(),
                  ),
                  const SizedBox(width: 8),
                  _buildFilterInfoChip(),
                ],
              ),
            ],
          ),
        ),
        
        // Services list
        Expanded(
          child: _filteredItems.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _filteredItems.length,
                    itemBuilder: (context, index) {
                      final service = _filteredItems[index];
                      return _buildEnhancedServiceCard(context, service);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildSortChip() {
    final currentSort = _sortOptions.firstWhere((s) => s['id'] == _sortBy);
    return FilterChip(
      selected: true,
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FaIcon(currentSort['icon'], size: 12),
          const SizedBox(width: 4),
          Text(currentSort['name']),
        ],
      ),
      onSelected: (selected) => _showSortDialog(),
      backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
      selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
      checkmarkColor: Theme.of(context).colorScheme.primary,
    );
  }

  Widget _buildFilterInfoChip() {
    int activeFilters = 0;
    if (_selectedCategory != 'all') activeFilters++;
    if (_selectedDuration != 'all') activeFilters++;
    if (_minPrice > 0 || _maxPrice < 1000000) activeFilters++;
    
    return FilterChip(
      selected: activeFilters > 0,
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const FaIcon(FontAwesomeIcons.sliders, size: 12),
          const SizedBox(width: 4),
          Text('Bộ lọc${activeFilters > 0 ? ' ($activeFilters)' : ''}'),
        ],
      ),
      onSelected: (selected) => _showFilterDialog(),
      backgroundColor: activeFilters > 0 
          ? Colors.orange.withOpacity(0.1)
          : Colors.grey.shade100,
      selectedColor: Colors.orange.withOpacity(0.2),
      checkmarkColor: Colors.orange,
    );
  }

  Widget _buildCategoryChip(Map<String, String> category, bool isSelected) {
    final color = _getCategoryColor(category['id']!);
    return Container(
      margin: const EdgeInsets.only(right: 12),
      child: FilterChip(
        selected: isSelected,
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              category['emoji']!,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(width: 6),
            Text(
              category['name']!,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
        onSelected: (selected) {
          _onCategoryChanged(category['id']!);
        },
        backgroundColor: Colors.grey.shade100,
        selectedColor: color.withOpacity(0.2),
        checkmarkColor: color,
        side: BorderSide(
          color: isSelected ? color : Colors.grey.shade300,
          width: isSelected ? 2 : 1,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(25),
        ),
        labelStyle: TextStyle(
          color: isSelected ? color : Colors.grey.shade700,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: FaIcon(
              FontAwesomeIcons.magnifyingGlass,
              size: 48,
              color: Colors.grey.shade400,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            _searchQuery.isNotEmpty ? 'Không tìm thấy dịch vụ' : 'Chưa có dịch vụ nào',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: Colors.grey.shade600,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchQuery.isNotEmpty 
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Danh sách dịch vụ sẽ xuất hiện ở đây',
            style: TextStyle(color: Colors.grey.shade500),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildEnhancedServiceCard(BuildContext context, Map<String, dynamic> service) {
    final name = (service['name'] as String?) ?? 'Dịch vụ';
    final description = (service['description'] as String?) ?? '';
    final price = (service['price'] as num?)?.toDouble() ?? 0;
    final duration = service['duration'] ?? 0;
    final photo = service['photo'] as String?;
    final category = (service['category'] as String?) ?? 'general';
    final rating = (service['rating'] as num?)?.toDouble() ?? 0;
    final reviewCount = (service['reviewCount'] as num?)?.toInt() ?? 0;
    final bookingCount = (service['bookingCount'] as num?)?.toInt() ?? 0;
    
    final priceFormat = NumberFormat.currency(symbol: '₫');
    final categoryColor = _getCategoryColor(category);
    final categoryIcon = _getCategoryIcon(category);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            spreadRadius: 0,
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => const AppointmentBookingPage(),
              ),
            );
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image Section
              Container(
                height: 160,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                  gradient: LinearGradient(
                    colors: [
                      categoryColor.withOpacity(0.8),
                      categoryColor,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Stack(
                  children: [
                    // Background image or placeholder
                    if (photo != null && photo.isNotEmpty)
                      ClipRRect(
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(20),
                          topRight: Radius.circular(20),
                        ),
                        child: Image.network(
                          photo,
                          width: double.infinity,
                          height: 160,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return _buildImagePlaceholder(categoryIcon, categoryColor);
                          },
                        ),
                      )
                    else
                      _buildImagePlaceholder(categoryIcon, categoryColor),
                    
                    // Gradient overlay
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(20),
                          topRight: Radius.circular(20),
                        ),
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.3),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                    
                    // Category badge
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            FaIcon(
                              categoryIcon,
                              size: 12,
                              color: categoryColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _getCategoryName(category),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: categoryColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    // Price badge
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Từ ${priceFormat.format(price)}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: categoryColor,
                          ),
                        ),
                      ),
                    ),
                    
                    // Popularity indicator
                    if (bookingCount > 10)
                      Positioned(
                        bottom: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.orange.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const FaIcon(
                                FontAwesomeIcons.fire,
                                size: 10,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Phổ biến',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              
              // Content Section
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title and rating
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                        ),
                        if (rating > 0) ...[
                          const FaIcon(
                            FontAwesomeIcons.star,
                            size: 14,
                            color: Colors.amber,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            rating.toStringAsFixed(1),
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade700,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '($reviewCount)',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ],
                    ),
                    
                    const SizedBox(height: 8),
                    
                    // Description
                    Text(
                      description,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Duration and booking info
                    Row(
                      children: [
                        FaIcon(
                          FontAwesomeIcons.clock,
                          size: 12,
                          color: Colors.grey.shade500,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${duration} phút',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade500,
                          ),
                        ),
                        const SizedBox(width: 16),
                        FaIcon(
                          FontAwesomeIcons.calendarCheck,
                          size: 12,
                          color: Colors.grey.shade500,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '$bookingCount lượt đặt',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Book button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const AppointmentBookingPage(),
                            ),
                          );
                        },
                        icon: const FaIcon(FontAwesomeIcons.calendarPlus, size: 14),
                        label: const Text('Đặt ngay'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: categoryColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder(IconData icon, Color color) {
    return Container(
      width: double.infinity,
      height: 160,
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Center(
        child: FaIcon(
          icon,
          size: 48,
          color: color.withOpacity(0.6),
        ),
      ),
    );
  }

  void _showSortDialog() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Sắp xếp theo',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ..._sortOptions.map((option) => ListTile(
              leading: FaIcon(
                option['icon'],
                color: _sortBy == option['id'] 
                    ? Theme.of(context).colorScheme.primary 
                    : Colors.grey.shade600,
              ),
              title: Text(option['name']),
              trailing: _sortBy == option['id'] 
                  ? FaIcon(
                      FontAwesomeIcons.check,
                      color: Theme.of(context).colorScheme.primary,
                      size: 16,
                    )
                  : null,
              onTap: () {
                _onSortChanged(option['id']);
                Navigator.pop(context);
              },
            )),
          ],
        ),
      ),
    );
  }

  void _showFilterDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Bộ lọc',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              
              // Duration filter
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Thời gian',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _durationFilters.map((duration) {
                  final isSelected = _selectedDuration == duration['id'];
                  return FilterChip(
                    selected: isSelected,
                    label: Text(duration['name']),
                    onSelected: (selected) {
                      setModalState(() {
                        _selectedDuration = duration['id'];
                      });
                    },
                  );
                }).toList(),
              ),
              
              const SizedBox(height: 16),
              
              // Price range
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Khoảng giá',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        labelText: 'Từ',
                        prefixText: '₫',
                        border: const OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      onChanged: (value) {
                        final price = double.tryParse(value) ?? 0;
                        setModalState(() {
                          _minPrice = price;
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        labelText: 'Đến',
                        prefixText: '₫',
                        border: const OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      onChanged: (value) {
                        final price = double.tryParse(value) ?? 1000000;
                        setModalState(() {
                          _maxPrice = price;
                        });
                      },
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Apply button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    _applyFilters();
                    Navigator.pop(context);
                  },
                  child: const Text('Áp dụng bộ lọc'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'grooming':
        return Colors.orange;
      case 'medical':
        return Colors.red;
      case 'hotel':
        return Colors.blue;
      case 'food':
        return Colors.green;
      default:
        return Colors.purple;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'grooming':
        return FontAwesomeIcons.scissors;
      case 'medical':
        return FontAwesomeIcons.stethoscope;
      case 'hotel':
        return FontAwesomeIcons.hotel;
      case 'food':
        return FontAwesomeIcons.utensils;
      default:
        return FontAwesomeIcons.paw;
    }
  }

  String _getCategoryName(String category) {
    switch (category.toLowerCase()) {
      case 'grooming':
        return 'Grooming';
      case 'medical':
        return 'Y tế';
      case 'hotel':
        return 'Khách sạn';
      case 'food':
        return 'Thức ăn';
      default:
        return 'Khác';
    }
  }
}
